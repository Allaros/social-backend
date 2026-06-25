import { BadRequestException, Injectable } from '@nestjs/common';
import { ProfileQueryService } from '../services/profile-query.service';
import { CompositeCursorQueryHelper } from '@app/shared/cursor/helpers/composite-cursor-qb';
import { CursorCodec } from '@app/shared/cursor/codec/cursor-codec';
import { ProfileResponseBuilder } from '../builders/profile-response.builder';
import {
  ProfileListItem,
  ProfileRelationType,
  RelationRawRow,
} from '../types/profile.interface';
import { PresenceStateService } from '@app/modules/websocket/services/presence-state.service';
import { PaginationExecutor } from '@app/shared/cursor/helpers/pagination-executor';
import { SelectQueryBuilder } from 'typeorm';
import { ProfileEntity } from '../entities/profile.entity';

type RelationsCursor = {
  createdAt: string;
  id: number;
};

const relationsCursorCodec = new CursorCodec<RelationsCursor>([
  'createdAt',
  'id',
]);

@Injectable()
export class GetRelationsUseCase {
  constructor(
    private readonly profileQueryService: ProfileQueryService,
    private readonly profileResponseBuilder: ProfileResponseBuilder,
    private readonly presenceStateService: PresenceStateService,
  ) {}

  async execute({
    profileId,
    viewerId,
    type,
    query,
    cursor,
    limit = 20,
  }: {
    profileId: number;
    viewerId: number;
    type: ProfileRelationType;
    query?: string;
    cursor?: string;
    limit?: number;
  }) {
    const builders: Record<
      ProfileRelationType,
      (profileId: number) => SelectQueryBuilder<ProfileEntity>
    > = {
      friends: (profileId) =>
        this.profileQueryService.buildFriendsQuery(profileId),

      followers: (profileId) =>
        this.profileQueryService.buildFollowersQuery(profileId),

      following: (profileId) =>
        this.profileQueryService.buildFollowingQuery(profileId),
    };

    const builder = builders[type];

    if (!builder) {
      throw new BadRequestException('Invalid relation type');
    }

    const qb = builder(profileId);

    this.profileQueryService.applyLocalSearch(qb, query);

    this.profileQueryService.applyProfileState(qb, viewerId);

    const decodedCursor = relationsCursorCodec.decode(cursor);

    const relationAlias = type === 'friends' ? 'f1' : 'f';

    const relationRawField =
      type === 'friends' ? 'friend_created_at' : 'follow_created_at';

    CompositeCursorQueryHelper.applyCompositeCursor(qb, decodedCursor, {
      order: 'DESC',

      fields: [
        {
          key: 'createdAt',
          column: `${relationAlias}.createdAt`,
        },

        {
          key: 'id',
          column: 'profile.id',
        },
      ],
    });

    const result = await PaginationExecutor.paginate<
      ProfileEntity,
      RelationsCursor,
      RelationRawRow
    >(
      qb,
      limit,
      {
        fields: ['createdAt', 'id'],
        order: 'DESC',
      },
      (profile, raw) => ({
        createdAt: raw[relationRawField]!,
        id: profile.id,
      }),
      relationsCursorCodec,
    );

    const resultRawMap = new Map(
      result.raw.map((row) => [row.profile_id, row]),
    );

    const onlineMap = await this.presenceStateService.getOnlineStatuses(
      result.data.map((profile) => profile.id),
    );

    const calculatedMap = new Map(
      result.data.map((profile) => {
        const row = resultRawMap.get(profile.id);

        return [
          profile.id,
          {
            isOwner: row?.is_owner ?? false,

            isFollowed: row?.is_followed ?? false,

            isFollower: row?.is_follower ?? false,

            isOnline: onlineMap.get(profile.id) ?? false,
          },
        ];
      }),
    );

    const data = this.profileResponseBuilder.buildList(
      result.data,
      calculatedMap,
    );

    return {
      data: data as ProfileListItem[],
      nextCursor: result.nextCursor,
    };
  }
}
