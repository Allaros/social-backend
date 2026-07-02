import { MessagesEvents } from '@app/shared/events/domain-events';
import { Injectable } from '@nestjs/common';
import { RealtimeMessageCreatedEvent } from '../events/realtime-message-created.event';
import { SocketEmitterService } from '@app/modules/websocket/services/socket-emitter.service';
import { OnEvent } from '@nestjs/event-emitter';
import { WsMessageEvents } from '@app/shared/events/ws-events';
import { RealtimeMessagesDeletedEvent } from '../events/realtime-messages-deleted.event';
import { RealtimeMessagesReadEvent } from '../events/realtime-messages-read.event';
import { RealtimeMessageEditedEvent } from '../events/realtime-message-edited.event';

@Injectable()
export class MessageRealtimeListener {
  constructor(private readonly socketEmitter: SocketEmitterService) {}

  @OnEvent(MessagesEvents.REALTIME_MESSAGE_CREATED)
  sendRealtimeMessage(event: RealtimeMessageCreatedEvent) {
    this.socketEmitter.emitToChat(
      event.chatId,
      WsMessageEvents.REALTIME_MESSAGE_CREATED,
      { ...event },
    );
  }

  @OnEvent(MessagesEvents.REALTIME_MESSAGE_DELETED)
  deleteRealtimeMessage(event: RealtimeMessagesDeletedEvent) {
    this.socketEmitter.emitToChat(
      event.chatId,
      WsMessageEvents.REALTIME_MESSAGE_DELETED,
      { ...event },
    );
  }

  @OnEvent(MessagesEvents.REALTIME_MESSAGE_READ)
  readRealtimeMessage(event: RealtimeMessagesReadEvent) {
    this.socketEmitter.emitToChat(
      event.chatId,
      WsMessageEvents.REALTIME_MESSAGE_READ,
      { ...event },
    );
  }

  @OnEvent(MessagesEvents.REALTIME_MESSAGE_EDITED)
  editRealtimeMessage(event: RealtimeMessageEditedEvent) {
    console.log('Message edited!');
    this.socketEmitter.emitToChat(
      event.chatId,
      WsMessageEvents.REALTIME_MESSAGE_EDITED,
      { ...event },
    );
  }
}
