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
  lastVisibleMessageAt: number;
  lastVisibleMessageId: number;
};

const chatsCursorCodec = new CursorCodec<ChatsCursor>([
  'lastVisibleMessageAt',
  'lastVisibleMessageId',
]);

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

    // Позволяем переданным идентификаторам участвовать в списке чатов несмотря на фильтры
    // Например новый чат без сообщений будет отображаться в списке
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

    // Создаем запрос к бд и применяем основные фильтры
    const qb = this.chatQueryService.buildMyChatsQuery(profileId);
    this.chatQueryService.applySearch(qb, profileId, query);
    this.chatQueryService.applyVisibility(qb, {
      archived,
      pinned,
    });

    // Подтягиваем последнее сообщение, которое НЕ скрыто именно для текущего участника чата.
    this.chatQueryService.applyLastVisibleMessageJoin(qb);

    // Сортируем список чатов по последнему видимому сообщению.
    // Если все сообщения скрыты, используем дату создания чата как fallback.
    qb.orderBy('COALESCE(lm."createdAt", chat."createdAt")', 'DESC').addOrderBy(
      'COALESCE(lm.id, 0)',
      'DESC',
    );

    //Создаем и применяем курсор. Используем те же поля, что и сортировка
    const decodedCursor = chatsCursorCodec.decode(cursor);
    CompositeCursorQueryHelper.applyCompositeCursor(qb, decodedCursor, {
      order: 'DESC',
      fields: [
        {
          key: 'lastVisibleMessageAt',
          column: 'COALESCE(lm."createdAt", chat."createdAt")',
        },
        {
          key: 'lastVisibleMessageId',
          column: 'COALESCE(lm.id, 0)',
        },
      ],
    });

    // Принудительно включаем некоторые чаты в выдачу,
    // даже если они не проходят текущие фильтры поиска.
    if (includedChatIds.length) {
      this.chatQueryService.applyIncludedIdentifiers(
        qb,
        includedChatIds,
        profileId,
      );
    }

    const result = await PaginationExecutor.paginate<
      ChatMemberEntity,
      ChatsCursor,
      Record<string, unknown>
    >(
      qb,
      limit,
      {
        fields: ['lastVisibleMessageAt', 'lastVisibleMessageId'],
        order: 'DESC',
      },
      // Формируем курсор из последнего видимого сообщения.
      // Если сообщений не осталось (все скрыты), используем chat.createdAt.
      (member, raw) => ({
        lastVisibleMessageAt: raw['lm_createdAt']
          ? new Date(raw['lm_createdAt'] as string).getTime()
          : member.chat.createdAt.getTime(),

        lastVisibleMessageId: Number(raw['lm_id'] ?? 0),
      }),
      chatsCursorCodec,
    );

    // Собираем данные о последнем видимом сообщении чата
    const lastMessageMap = new Map(
      result.raw.map((row) => [
        row['member_chatId'] as number,
        {
          text: (row['lm_text'] as string) ?? null,
          senderName: (row['lm_senderName'] as string) ?? null,
          senderAvatarUrl: (row['lm_senderAvatarUrl'] as string) ?? null,
          createdAt: (row['lm_createdAt'] as string) ?? null,
          attachmentsCount: Number(row['lm_attachmentsCount'] ?? 0),
        },
      ]),
    );

    // Для direct-чатов дополнительно загружаем
    // профиль собеседника.
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

    // Получаем онлайн-статусы собеседников
    // для отображения в списке чатов.
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
