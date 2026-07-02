import { Injectable } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { EntityManager } from 'typeorm';
import { NotFoundError } from 'rxjs';
import EventEmitter2 from 'eventemitter2';
import { ChatEvents } from '@app/shared/events/domain-events';
import { ChatInitializedEvent } from '../events/chat-initialized.event';

@Injectable()
export class ApplyMessageToChatUseCase {
  constructor(
    private readonly chatService: ChatService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    chatId,
    messageId,
    createdAt,
    manager,
  }: {
    messageId: number;
    createdAt: Date;
    chatId: number;
    excludedMemberIds?: number[];
    manager?: EntityManager;
  }) {
    const chat = await this.chatService.findById(chatId);

    if (!chat) throw new NotFoundError('Чат не найден');

    await this.chatService.updateLastMessage({
      chatId,
      createdAt,
      messageId,
      manager,
    });

    if (!chat.isInitialized) {
      await this.chatService.initializeChat(chatId, manager);

      this.eventEmitter.emit(
        ChatEvents.CHAT_INITIALIZED,
        new ChatInitializedEvent({
          chatId,
        }),
      );
    }
  }
}
