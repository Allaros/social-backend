import { Injectable } from '@nestjs/common';
import { ChatQueryService } from '../services/chat-query.service';
import { CompositeCursorQueryHelper } from '@app/shared/cursor/helpers/composite-cursor-qb';
import { PaginationExecutor } from '@app/shared/cursor/helpers/pagination-executor';
import { CursorCodec } from '@app/shared/cursor/codec/cursor-codec';
import { ChatMemberEntity } from '../entities/chat-member.entity';
import { ChatResponseBuilder } from '../builders/chat-response.builder';
import { ChatTypeEnum } from '../types/chat.interface';
import { ResolveChatByIdentifierUseCase } from './resolve-chat-by-identifier.usecase';
import { PresenceStateService } from '@app/modules/websocket/services/presence-state.service';

type ChatsCursor = {
  lastMessageAt: number;
  id: number;
};

const chatsCursorCodec = new CursorCodec<ChatsCursor>(['lastMessageAt', 'id']);

@Injectable()
export class GetMyChatsUseCase {
  constructor(
    private readonly chatQueryService: ChatQueryService,
    private readonly chatResponseBuilder: ChatResponseBuilder,
    private readonly resolveChatByIdentifier: ResolveChatByIdentifierUseCase,
    private readonly presenceStateService: PresenceStateService,
  ) {}

  async execute({
    profileId,
    query,
    archived,
    pinned,
    cursor,
    limit = 20,
    includedIdentifiers,
  }: {
    profileId: number;
    query?: string;
    archived?: boolean;
    pinned?: boolean;
    cursor?: string;
    limit?: number;
    includedIdentifiers?: string[];
  }) {
    let includedChatIds: number[] = [];

    if (includedIdentifiers?.length) {
      const resolved = await Promise.all(
        includedIdentifiers.map((identifier) =>
          this.resolveChatByIdentifier
            .execute({ identifier, currentProfileId: profileId })
            .catch(() => null),
        ),
      );
      includedChatIds = resolved
        .filter((chat): chat is NonNullable<typeof chat> => chat !== null)
        .map((chat) => chat.id);
    }

    const qb = this.chatQueryService.buildMyChatsQuery(profileId);
    this.chatQueryService.applySearch(qb, profileId, query);
    this.chatQueryService.applyVisibility(qb, {
      archived,
      pinned,
    });

    const decodedCursor = chatsCursorCodec.decode(cursor);
    CompositeCursorQueryHelper.applyCompositeCursor(qb, decodedCursor, {
      order: 'DESC',
      fields: [
        {
          key: 'lastMessageAt',
          column: 'chat.lastMessageAt',
        },

        {
          key: 'id',
          column: 'chat.id',
        },
      ],
    });

    if (includedChatIds.length) {
      this.chatQueryService.applyIncludedIdentifiers(
        qb,
        includedChatIds,
        profileId,
      );
    }

    this.chatQueryService.applyLastMessageJoin(qb);

    const result = await PaginationExecutor.paginate<
      ChatMemberEntity,
      ChatsCursor,
      Record<string, unknown>
    >(
      qb,
      limit,
      {
        fields: ['lastMessageAt', 'id'],
        order: 'DESC',
      },
      (member) => ({
        lastMessageAt: member.chat.lastMessageAt
          ? member.chat.lastMessageAt.getTime()
          : member.chat.createdAt.getTime(),
        id: member.chat.id,
      }),
      chatsCursorCodec,
    );

    const lastMessageMap = new Map(
      result.raw.map((row) => [
        row['member_chatId'] as number,
        {
          text: (row['lm_text'] as string) ?? null,
          senderName: (row['lm_senderName'] as string) ?? null,
          senderAvatarUrl: (row['lm_senderAvatarUrl'] as string) ?? null,
          createdAt: (row['lm_createdAt'] as string) ?? null,
        },
      ]),
    );

    const directChatIds = result.data
      .filter((member) => member.chat.type === ChatTypeEnum.DIRECT)
      .map((member) => member.chat.id);

    const directTargets = await this.chatQueryService.getDirectTargets({
      currentProfileId: profileId,
      chatIds: directChatIds,
    });

    const directTargetsMap = new Map(
      directTargets.map((member) => [member.chatId, member.profile]),
    );

    const targetProfileIds = directTargets
      .map((member) => member.profile?.id)
      .filter((id): id is number => !!id);

    const onlineStatusMap =
      await this.presenceStateService.getOnlineStatuses(targetProfileIds);

    return {
      data: this.chatResponseBuilder.buildChatList({
        members: result.data,
        directTargetsMap,
        lastMessageMap,
        onlineStatusMap,
      }),
      nextCursor: result.nextCursor,
    };
  }
}
