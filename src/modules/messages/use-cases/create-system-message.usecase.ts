import { Injectable, NotFoundException } from '@nestjs/common';
import { MessagesService } from '../services/messages.service';
import { MessagesTypeEnum } from '../types/messages.interface';
import { MessagesContentService } from '../services/messages-content.service';
import { EntityManager } from 'typeorm';
import { ApplyMessageToChatUseCase } from '@app/modules/chat/use-cases/apply-message-to-chat.usecase';
import EventEmitter2 from 'eventemitter2';
import { MessagesEvents } from '@app/shared/events/domain-events';
import { MessageCreatedEvent } from '../events/message-created.event';
import { ChatService } from '@app/modules/chat/services/chat.service';

@Injectable()
export class CreateSystemMessageUseCase {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesContentService: MessagesContentService,
    private readonly applyMessageToChatUseCase: ApplyMessageToChatUseCase,
    private readonly chatService: ChatService,
    private readonly eventEmitter: EventEmitter2,
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
    const chat = await this.chatService.findRealtimeChat(chatId);
    if (!chat) throw new NotFoundException('Чат не найден');

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

    const reseiverIds = chat?.members.map((member) => member.id);

    this.eventEmitter.emit(
      MessagesEvents.MESSAGE_CREATED,
      new MessageCreatedEvent({
        actorId: null,
        messageId: message.id,
        receiverMemberIds: reseiverIds,
      }),
    );

    return message;
  }
}
