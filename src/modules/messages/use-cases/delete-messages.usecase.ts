import { ForbiddenException, Injectable } from '@nestjs/common';
import { MessagesService } from '../services/messages.service';
import { ResolveChatByIdentifierUseCase } from '@app/modules/chat/use-cases/resolve-chat-by-identifier.usecase';
import { ChatPermissionService } from '@app/modules/chat/services/chat-permission.service';
import { DataSource } from 'typeorm';
import { MessagesContentService } from '../services/messages-content.service';
import EventEmitter2 from 'eventemitter2';
import { MessagesEvents } from '@app/shared/events/domain-events';
import { MessageDeletedEvent } from '../events/message-deleted.event';
import { MessageEntity } from '../entities/messages.entity';

@Injectable()
export class DeleteMessagesUseCase {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesContentService: MessagesContentService,
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly chatPermissionService: ChatPermissionService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    chatIdentifier,
    messageIds,
    currentProfileId,
  }: {
    chatIdentifier: string;
    messageIds: number[];
    currentProfileId: number;
  }) {
    const chat = await this.resolveChatByIdentifierUseCase.execute({
      identifier: chatIdentifier,
      currentProfileId,
      options: {
        relations: ['members'],
      },
    });

    const member = await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: currentProfileId,
    });

    const persistedMessageIds = this.filterPersistedMessageIds(messageIds);

    if (!persistedMessageIds.length) {
      return;
    }

    const messages = await this.messagesService.ensureMessagesBelongsToChat(
      chat.id,
      messageIds,
      undefined,
      ['attachments'],
    );

    const activeMessages = this.getActiveMessages(messages);

    if (!activeMessages.length) return;

    this.ensureMessagesOwnedByMember(messages, member.id);

    const contentIds = activeMessages
      .map((message) => message.contentId)
      .filter((id): id is number => id !== null);

    const attachmentsIds = activeMessages.flatMap((message) =>
      message.attachments.map((attachment) => attachment.id),
    );

    const finalMessagesIds = activeMessages.map((message) => message.id);

    await this.dataSource.transaction(async (manager) => {
      if (contentIds.length) {
        await this.messagesContentService.hardDelete(contentIds, manager);
      }

      await this.messagesService.messagesDelete(
        chat.id,
        finalMessagesIds,
        manager,
      );
    });

    this.eventEmitter.emit(
      MessagesEvents.MESSAGE_DELETED,
      new MessageDeletedEvent({
        messageIds: finalMessagesIds,
        attachmentsIds,
        chatId: chat.id,
      }),
    );
  }

  private ensureMessagesOwnedByMember(
    messages: MessageEntity[],
    memberId: number,
  ) {
    const hasForeignMessages = messages.some(
      (message) => message.senderMemberId !== memberId,
    );

    if (hasForeignMessages) {
      throw new ForbiddenException(
        'Одно или несколько сообщений не принадлежат пользователю',
      );
    }
  }

  private getActiveMessages(messages: MessageEntity[]) {
    return messages.filter((message) => !message.deletedAt);
  }

  private filterPersistedMessageIds(messageIds: number[]) {
    return messageIds.filter((id) => id > 0);
  }
}
