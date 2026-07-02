import { MessageCreatedEvent } from '@app/modules/messages/events/message-created.event';
import { MessagesEvents } from '@app/shared/events/domain-events';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MessageDeletedEvent } from '@app/modules/messages/events/message-deleted.event';
import { RecalculateUnreadMessagesUseCase } from '../use-cases/recalculate-unread-messages.usecase';
import { MessagesReadEvent } from '../events/messages-read.event';
import { RealtimeMessagesChangeUseCase } from '../use-cases/realtime-messages-change.usecase';
import { MessageEditedEvent } from '../events/message-edited.event';
import { MessagesHideEvent } from '../events/messages-hide.event';

@Injectable()
export class MessagesActionsListener {
  constructor(
    private readonly recalculateUnreadMessagesUseCase: RecalculateUnreadMessagesUseCase,
    private readonly realtimeMessagesChangeUseCase: RealtimeMessagesChangeUseCase,
  ) {}

  private readonly logger = new Logger(MessagesActionsListener.name);

  @OnEvent(MessagesEvents.MESSAGE_CREATED)
  async handleMessageCreated(event: MessageCreatedEvent) {
    await this.recalculateUnreadMessagesUseCase.simpleIncrementForCreatedMessages(
      event.receiverMemberIds,
    );

    await this.realtimeMessagesChangeUseCase.createRealtimeMessage(
      event.messageId,
      event.actorId,
    );
  }

  @OnEvent(MessagesEvents.MESSAGE_DELETED)
  async handleMessageDeleted(event: MessageDeletedEvent) {
    this.logger.log('MESSAGE_DELETED event emitted');

    await this.recalculateUnreadMessagesUseCase.decrementForDeletedMessages(
      event.receiverMemberIds,
      event.messageIds,
    );

    await this.realtimeMessagesChangeUseCase.deleteRealtimeMessages(
      event.messageIds,
      event.actorProfileId,
      event.chatId,
    );
  }

  @OnEvent(MessagesEvents.MESSAGES_READ)
  async handleMessagesRead(event: MessagesReadEvent) {
    await this.recalculateUnreadMessagesUseCase.decrementForReadMessages(
      event.memberId,
      event.messageIds.length,
    );

    await this.realtimeMessagesChangeUseCase.readRealtimeMessages(
      event.messageIds,
      event.profileId,
      event.chatId,
    );
  }

  @OnEvent(MessagesEvents.MESSAGE_EDITED)
  async editRealtimeMessage(event: MessageEditedEvent) {
    await this.realtimeMessagesChangeUseCase.editRealtimeMessage(
      event.messageId,
      event.actorId,
      event.newText,
      event.chatId,
    );
  }

  @OnEvent(MessagesEvents.MESSAGES_HIDED)
  async hideReatimeMessages(event: MessagesHideEvent) {
    await this.realtimeMessagesChangeUseCase.hideRealtimeMessages(
      event.actorProfileId,
      event.chatId,
    );
  }
}
