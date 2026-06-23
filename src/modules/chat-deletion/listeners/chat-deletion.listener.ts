import { Injectable } from '@nestjs/common';
import { ChatDeletionService } from '../services/chat-deletion.service';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatEvents } from '@app/shared/events/domain-events';
import { ChatMarkedAsDeletedEvent } from '@app/modules/chat/events/chat-marked-as-deleted.event';

@Injectable()
export class ChatDeletionListener {
  constructor(private readonly chatDeletionService: ChatDeletionService) {}

  @OnEvent(ChatEvents.CHAT_MARKED_AS_DELETED)
  async addChatToDeletionList(event: ChatMarkedAsDeletedEvent) {
    await this.chatDeletionService.create(event.chatId);
  }
}
