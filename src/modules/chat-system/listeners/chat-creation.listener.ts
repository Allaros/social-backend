import { Injectable } from '@nestjs/common';
import { InitiateGroupChatUseCase } from '../use-cases/initiate-group-chat.usecase';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatEvents } from '@app/shared/events/domain-events';
import { ChatGroupCreatedEvent } from '@app/modules/chat/events/chat-group-created.event';

@Injectable()
export class ChatCreationListener {
  constructor(
    private readonly initiateGroupChatUseCase: InitiateGroupChatUseCase,
  ) {}

  @OnEvent(ChatEvents.CHAT_GROUP_CREATED)
  async initiateChat(event: ChatGroupCreatedEvent) {
    await this.initiateGroupChatUseCase.execute({
      initiatorId: event.ownerId,
      chatId: event.chatId,
      invitedProfileIds: event.invitedProfileIds,
    });
  }
}
