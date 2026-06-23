import { Injectable } from '@nestjs/common';
import { MessagesQueryService } from '../services/messages-query.service';
import { MessageResponseBuilder } from '../builders/messages-response.builder';
import { ResolveChatByIdentifierUseCase } from '@app/modules/chat/use-cases/resolve-chat-by-identifier.usecase';
import { ChatPermissionService } from '@app/modules/chat/services/chat-permission.service';
import { ChatEntity } from '@app/modules/chat/entities/chat.entity';

@Injectable()
export class GetMessagesUseCase {
  constructor(
    private readonly messagesQueryService: MessagesQueryService,
    private readonly messageResponseBuilder: MessageResponseBuilder,
    private readonly resolveChatByIdentifier: ResolveChatByIdentifierUseCase,
    private readonly chatPermissionService: ChatPermissionService,
  ) {}

  async execute({
    chatIdentifier,
    currentProfileId,
    limit = 30,
    cursor,
    query,
  }: {
    currentProfileId: number;
    chatIdentifier: string;
    cursor?: string;
    query?: string;
    limit?: number;
  }) {
    const chat = await this.resolveChatByIdentifier.execute({
      identifier: chatIdentifier,
      currentProfileId,
      options: {
        relations: ['members'],
      },
    });

    const chatId = chat.id;

    const member = await this.chatPermissionService.ensureMember({
      chatId,
      profileId: currentProfileId,
    });

    const lastReadMessageId = this.getLastReadMessageIdByMembers(
      chat,
      currentProfileId,
    );

    const idsQb = this.messagesQueryService.buildIdsQuery(chatId);

    if (query) {
      idsQb.leftJoin('message.content', 'content');
      this.messagesQueryService.applySearch(idsQb, query);
    }

    this.messagesQueryService.applyHiddenMessagesFilter(idsQb, member.id);
    this.messagesQueryService.applyLeftAtVisibility(idsQb, member.leftAt);

    this.messagesQueryService.applyCursor(idsQb, cursor);

    const { ids, nextCursor } = await this.messagesQueryService.executeIdsQuery(
      idsQb,
      limit,
    );

    if (!ids.length) return { data: [], nextCursor: null };

    const dataQb = this.messagesQueryService.buildDataQuery(ids);
    this.messagesQueryService.applyContentJoin(dataQb);
    this.messagesQueryService.applySenderJoin(dataQb);
    this.messagesQueryService.applyAttachmentsJoin(dataQb);
    this.messagesQueryService.applyReplyJoin(dataQb);
    this.messagesQueryService.applyForwardedFromJoin(dataQb);

    const data = await this.messagesQueryService.executeDataQuery(dataQb, ids);

    return {
      data: await this.messageResponseBuilder.buildMessages(
        data,
        currentProfileId,
        lastReadMessageId,
      ),
      nextCursor,
    };
  }

  private getLastReadMessageIdByMembers(
    chat: ChatEntity,
    currentProfileId: number,
  ): number | null {
    const lastReadIds = chat.members
      .filter((member) => member.profileId !== currentProfileId)
      .map((member) => member.lastReadMessageId)
      .filter((id): id is number => typeof id === 'number');

    if (!lastReadIds.length) return null;

    return Math.max(...lastReadIds);
  }
}
