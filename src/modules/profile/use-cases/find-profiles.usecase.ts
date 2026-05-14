import { Injectable } from '@nestjs/common';
import { ProfileQueryService } from '../services/profile-query.service';
import { SearchResult } from '@app/modules/search/types/search.interface';
import { ProfileResponseBuilder } from '../builders/profile-response.builder';
import { ProfileListItem, ProfileRawRow } from '../types/profile.interface';
import { PresenceService } from '@app/modules/presence/services/presence.service';

@Injectable()
export class FindProfilesUseCase {
  constructor(
    private readonly profileQueryService: ProfileQueryService,
    private readonly profileResponseBuilder: ProfileResponseBuilder,
    private readonly presenceService: PresenceService,
  ) {}

  async execute({
    query,
    viewerId,
    limit = 10,

    page,
  }: {
    query: string;
    viewerId: number;
    limit?: number;
    page?: number;
  }): Promise<SearchResult<ProfileListItem>> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return {
        data: [] as ProfileListItem[],
        meta: {
          total: 0,
          page: page ?? null,
          limit,
        },
      };
    }

    const qb = this.profileQueryService.buildBaseProfileQuery();

    this.profileQueryService.applySearch(qb, normalizedQuery, page);

    this.profileQueryService.applyProfileState(qb, viewerId);

    const normalizedLimit = Math.min(limit ?? 10, 50);

    qb.limit(normalizedLimit);

    if (page) {
      qb.offset((page - 1) * normalizedLimit);
    }

    const [result, total] = await Promise.all([
      qb.getRawAndEntities(),
      page ? qb.getCount() : Promise.resolve(null),
    ]);

    const typedRaw = result.raw as (ProfileRawRow & {
      profile_id: number;
    })[];

    const rawMap = new Map(typedRaw.map((row) => [row.profile_id, row]));

    const onlineMap = await this.presenceService.getOnlineStatuses(
      result.entities.map((profile) => profile.id),
    );

    const calculatedMap = new Map(
      result.entities.map((profile) => {
        const row = rawMap.get(profile.id);

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
      result.entities,
      calculatedMap,
    );

    return {
      data,
      meta: {
        total,
        page: page ?? null,
        limit: normalizedLimit,
      },
    };
  }
}
