import { Injectable } from '@nestjs/common';
import { MessagesService } from '../services/messages.service';
import { MessagesTypeEnum } from '../types/messages.interface';
import { MessagesContentService } from '../services/messages-content.service';
import { EntityManager } from 'typeorm';
import { ApplyMessageToChatUseCase } from '@app/modules/chat/use-cases/apply-message-to-chat.usecase';

@Injectable()
export class CreateSystemMessageUseCase {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesContentService: MessagesContentService,
    private readonly applyMessageToChatUseCase: ApplyMessageToChatUseCase,
  ) {}

  async execute({
    chatId,
    text,
    manager,
  }: {
    chatId: number;
    text: string;
    manager?: EntityManager;
  }) {
    const content = await this.messagesContentService.create({
      content: text,
      isEncrypted: false,
      manager,
    });

    const message = await this.messagesService.create({
      chatId,
      hasAttachments: false,
      type: MessagesTypeEnum.SYSTEM,
      senderMemberId: null,
      contentId: content.id,
      manager,
    });

    await this.applyMessageToChatUseCase.execute({
      chatId,
      messageId: message.id,
      createdAt: message.createdAt,
      manager,
    });

    return message;
  }
}
