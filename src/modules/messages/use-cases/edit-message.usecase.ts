import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { MessagesService } from '../services/messages.service';
import { MessagesContentService } from '../services/messages-content.service';
import { ResolveChatByIdentifierUseCase } from '@app/modules/chat/use-cases/resolve-chat-by-identifier.usecase';
import { ChatPermissionService } from '@app/modules/chat/services/chat-permission.service';
import { DataSource } from 'typeorm';
import EventEmitter2 from 'eventemitter2';
import { MessagesEvents } from '@app/shared/events/domain-events';
import { MessageEditedEvent } from '../events/message-edited.event';

@Injectable()
export class EditMessageUseCase {
  constructor(
    private readonly messageService: MessagesService,
    private readonly messagesContentService: MessagesContentService,
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly chatPermissionService: ChatPermissionService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    chatIdentifier,
    currentProfileId,
    messageId,
    newText,
  }: {
    messageId: number;
    currentProfileId: number;
    chatIdentifier: string;
    newText: string;
  }) {
    const content = newText.trim();

    const chat = await this.resolveChatByIdentifierUseCase.execute({
      identifier: chatIdentifier,
      currentProfileId,
    });

    const member = await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: currentProfileId,
    });

    const message = await this.messageService.ensureMessageBelongsToChat(
      chat.id,
      messageId,
      undefined,
      ['content', 'attachments'],
    );

    if (!content.length && !message.attachments.length)
      throw new BadRequestException('Нельзя оставить сообщение пустым');

    if (message.deletedAt)
      throw new ForbiddenException('Нельзя изменить удаленное сообщение');

    if (message.senderMemberId !== member.id)
      throw new ForbiddenException(
        'Вы не можете редактировать чужие сообщения',
      );

    if (message.forwardedFromMessageId)
      throw new ForbiddenException('Нельзя менять пересланное сообщение');

    const oldContent = message.content?.content ?? '';

    if (oldContent === content) {
      return;
    }
    await this.dataSource.transaction(async (manager) => {
      const editedAt = new Date();

      if (!content.length && message.contentId) {
        await this.messagesContentService.hardDelete(
          [message.contentId],
          manager,
        );

        await this.messageService.messageUpdate(
          messageId,
          {
            contentId: null,
            editedAt,
          },
          manager,
        );

        return;
      }

      if (message.contentId) {
        await this.messagesContentService.editContent(
          message.contentId,
          content,
          manager,
        );
      } else {
        const newContent = await this.messagesContentService.create({
          content,
          isEncrypted: false,
          manager,
        });

        await this.messageService.messageUpdate(
          messageId,
          {
            contentId: newContent.id,
          },
          manager,
        );
      }

      await this.messageService.messageUpdate(
        messageId,
        {
          editedAt,
        },
        manager,
      );
    });

    this.eventEmitter.emit(
      MessagesEvents.MESSAGE_EDITED,
      new MessageEditedEvent({
        actorId: currentProfileId,
        chatId: chat.id,
        messageId: message.id,
        newText: content,
      }),
    );
  }
}
