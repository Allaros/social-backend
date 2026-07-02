import { ChatEvents } from '@app/shared/events/domain-events';
import { Injectable } from '@nestjs/common';
import { ChatInitializedEvent } from '../events/chat-initialized.event';
import { OnEvent } from '@nestjs/event-emitter';
import { RealtimeChatControlUseCase } from '../use-cases/realtime-chat-control.usecase';
import { ChatMarkedAsDeletedEvent } from '../events/chat-marked-as-deleted.event';

@Injectable()
export class ChatExistenceListener {
  constructor(
    private readonly realtimeChatControlUseCase: RealtimeChatControlUseCase,
  ) {}

  @OnEvent(ChatEvents.CHAT_INITIALIZED)
  async initializeRealtimeChat(event: ChatInitializedEvent) {
    await this.realtimeChatControlUseCase.injectChatIntoList(event.chatId);
  }

  @OnEvent(ChatEvents.CHAT_MARKED_AS_DELETED)
  deleteRealtimeChat(event: ChatMarkedAsDeletedEvent) {
    this.realtimeChatControlUseCase.removeChatFromList(
      event.chatId,
      event.receiverProfileIds,
    );
  }
}
