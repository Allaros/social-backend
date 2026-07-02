import { SocketEmitterService } from '@app/modules/websocket/services/socket-emitter.service';
import { ChatEvents } from '@app/shared/events/domain-events';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatStateUpdatedEvent } from '../events/chat-state-updated.event';
import { WsChatEvents } from '@app/shared/events/ws-events';

@Injectable()
export class ChatRealtimeListener {
  constructor(private readonly socketEmitter: SocketEmitterService) {}

  @OnEvent(ChatEvents.REALTIME_CHAT_STATE_UPDATED)
  emitNewState(event: ChatStateUpdatedEvent) {
    this.socketEmitter.emitToDialogs(
      event.receiverProfileId,
      WsChatEvents.CHAT_STATE_UPDATED,
      { ...event },
    );
  }
}
