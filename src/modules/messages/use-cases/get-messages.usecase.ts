import { Injectable } from '@nestjs/common';
import { MessagesQueryService } from '../services/messages-query.service';
import { MessageResponseBuilder } from '../builders/messages-response.builder';
import { ResolveChatByIdentifierUseCase } from '@app/modules/chat/use-cases/resolve-chat-by-identifier.usecase';
import { ChatPermissionService } from '@app/modules/chat/services/chat-permission.service';

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
    });

    const chatId = chat.id;

    await this.chatPermissionService.ensureMember({
      chatId,
      profileId: currentProfileId,
    });

    const idsQb = this.messagesQueryService.buildIdsQuery(chatId);

    if (query) {
      idsQb.leftJoin('message.content', 'content');
      this.messagesQueryService.applySearch(idsQb, query);
    }

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

    const data = await this.messagesQueryService.executeDataQuery(dataQb, ids);

    return {
      data: await this.messageResponseBuilder.buildMessages(data),
      nextCursor,
    };
  }
}
