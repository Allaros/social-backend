import { ProfileQueryService } from '@app/modules/profile/services/profile-query.service';
import { Injectable } from '@nestjs/common';
import { ResolveChatByIdentifierUseCase } from './resolve-chat-by-identifier.usecase';
import { ChatPermissionService } from '../services/chat-permission.service';
import { CursorCodec } from '@app/shared/cursor/codec/cursor-codec';
import { CompositeCursorQueryHelper } from '@app/shared/cursor/helpers/composite-cursor-qb';
import { PaginationExecutor } from '@app/shared/cursor/helpers/pagination-executor';
import { ProfileEntity } from '@app/modules/profile/entities/profile.entity';
import { RelationRawRow } from '@app/modules/profile/types/profile.interface';
import { PresenceStateService } from '@app/modules/websocket/services/presence-state.service';
import { ChatMemberResponseBuilder } from '../builders/chat-member-response.builder';

export enum MemberChatStatusEnum {
  MEMBER = 'member',
  RESTRICTED = 'restricted',
  NOT_MEMBER = 'not_member',
}

type MembersToAddCursor = {
  createdAt: string;
  id: number;
};

const membersToAddCursorCodec = new CursorCodec<MembersToAddCursor>([
  'createdAt',
  'id',
]);

type MemberToAddRawRow = RelationRawRow & {
  is_chat_member: boolean;
  is_chat_restricted: boolean;
};

@Injectable()
export class GetMemberToAddUseCase {
  constructor(
    private readonly profileQueryService: ProfileQueryService,
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly chatPermissionService: ChatPermissionService,
    private readonly presenceStateService: PresenceStateService,
    private readonly chatMemberResponseBuilder: ChatMemberResponseBuilder,
  ) {}

  async execute({
    chatIdentifier,
    currentProfileId,
    query,
    cursor,
    limit = 10,
  }: {
    chatIdentifier: string;
    currentProfileId: number;
    query?: string;
    cursor?: string;
    limit: number;
  }) {
    const chat = await this.resolveChatByIdentifierUseCase.execute({
      identifier: chatIdentifier,
      currentProfileId,
    });

    const member = await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: currentProfileId,
    });

    if (!chat.isPublic) {
      this.chatPermissionService.ensureOwner(member);
    }

    const decodedCursor = cursor
      ? membersToAddCursorCodec.decode(cursor)
      : null;

    const qb = this.profileQueryService.buildFriendsQuery(currentProfileId);

    qb.addSelect(
      `
  EXISTS (
    SELECT 1
    FROM chat_members cm
    WHERE cm."chatId" = :chatId
    AND cm."profileId" = profile.id
  )
  `,
      'is_chat_member',
    );

    qb.addSelect(
      `
  EXISTS (
    SELECT 1
    FROM chat_members cm
    WHERE cm."chatId" = :chatId
    AND cm."profileId" = profile.id
    AND cm."restrictedUntil" > NOW()
  )
  `,
      'is_chat_restricted',
    );

    qb.setParameter('chatId', chat.id);

    this.profileQueryService.applyLocalSearch(qb, query);

    this.profileQueryService.applyProfileState(qb, currentProfileId);

    CompositeCursorQueryHelper.applyCompositeCursor(qb, decodedCursor, {
      order: 'DESC',
      fields: [
        {
          key: 'createdAt',
          column: 'f1.createdAt',
        },
        {
          key: 'id',
          column: 'profile.id',
        },
      ],
    });

    const result = await PaginationExecutor.paginate<
      ProfileEntity,
      MembersToAddCursor,
      MemberToAddRawRow
    >(
      qb,
      limit,
      {
        fields: ['createdAt', 'id'],
        order: 'DESC',
      },
      (profile, raw) => ({
        createdAt: raw.friend_created_at!,
        id: profile.id,
      }),
      membersToAddCursorCodec,
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

            chatStatus: row?.is_chat_member
              ? row.is_chat_restricted
                ? MemberChatStatusEnum.RESTRICTED
                : MemberChatStatusEnum.MEMBER
              : MemberChatStatusEnum.NOT_MEMBER,
          },
        ];
      }),
    );

    return {
      data: this.chatMemberResponseBuilder.buildCandidates(
        result.data,
        calculatedMap,
      ),
      nextCursor: result.nextCursor,
    };
  }
}
