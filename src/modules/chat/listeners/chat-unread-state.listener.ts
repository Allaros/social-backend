import { SocketEmitterService } from '@app/modules/websocket/services/socket-emitter.service';
import { ChatEvents } from '@app/shared/events/domain-events';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatUnreadStateChangedEvent } from '../events/chat-unread-state-changed.event';
import { WsChatEvents } from '@app/shared/events/ws-events';

@Injectable()
export class ChatUnreadStateListener {
  constructor(private readonly socketEmitter: SocketEmitterService) {}

  private readonly logger = new Logger(ChatUnreadStateListener.name);

  @OnEvent(ChatEvents.CHAT_UNREAD_STATE_CHANGED)
  emitUnreadStateChanged(event: ChatUnreadStateChangedEvent) {
    this.logger.log('CHAT_UNREAD_STATE_CHANGED event emitted. Payload:', {
      ...event,
    });
    this.socketEmitter.emitToProfile(
      event.profileId,
      WsChatEvents.UNREAD_STATE_CHANGED,
      {
        unreadChatsCountDelta: event.unreadChatsCountDelta,
        unreadMutedChatsCountDelta: event.unreadMutedChatsCountDelta,
      },
    );
  }
}
