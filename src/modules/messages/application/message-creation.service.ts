import { Injectable } from '@nestjs/common';
import { MessagesService } from '../services/messages.service';
import { MessagesContentService } from '../services/messages-content.service';
import { MessagesAttachmentService } from '../services/messages-attachment.service';
import { DataSource } from 'typeorm';
import { MessageAttachmentDto } from '../types/messages-attachment.dto';
import { MessagesTypeEnum } from '../types/messages.interface';
import { ApplyMessageToChatUseCase } from '@app/modules/chat/use-cases/apply-message-to-chat.usecase';

@Injectable()
export class MessageCreationService {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesContentService: MessagesContentService,
    private readonly messagesAttachmentsService: MessagesAttachmentService,
    private readonly dataSource: DataSource,
    private readonly applyMessageToChatUseCase: ApplyMessageToChatUseCase,
  ) {}

  async createMessage({
    attachments,
    chatId,
    senderMemberId,
    text,
    replyToMessageId,
    clientId,
  }: {
    chatId: number;

    senderMemberId: number;

    text?: string | null;

    attachments?: MessageAttachmentDto[];

    replyToMessageId?: number;
    clientId?: string;
  }) {
    return this.dataSource.transaction(async (manager) => {
      let contentId: number | null = null;

      if (text) {
        const content = await this.messagesContentService.create({
          content: text,
          isEncrypted: false,
          manager,
        });

        contentId = content.id;
      }

      const hasAttachments = !!attachments && attachments.length > 0;

      const message = await this.messagesService.create({
        chatId,
        hasAttachments: hasAttachments,
        senderMemberId,
        type: MessagesTypeEnum.DEFAULT,
        contentId: contentId,
        replyToMessageId,
        clientId,
        manager,
      });

      if (hasAttachments) {
        await this.messagesAttachmentsService.createMany({
          attachments,
          messageId: message.id,
          manager,
        });
      }

      await this.applyMessageToChatUseCase.execute({
        chatId,
        createdAt: message.createdAt,
        messageId: message.id,
        excludedMemberIds: [senderMemberId],
        manager,
      });

      return message;
    });
  }
}
