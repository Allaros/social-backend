import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PresenceEvents } from '@app/shared/events/domain-events';
import { UserOfflineEvent } from '../events/user-offline.event';
import { UserOnlineEvent } from '../events/user-online.event';
import { SocketEmitterService } from '@app/modules/websocket/services/socket-emitter.service';
import { WsPresenceEvents } from '@app/shared/events/ws-events';

@Injectable()
export class PresenceListener {
  constructor(private readonly socketEmitter: SocketEmitterService) {}

  @OnEvent(PresenceEvents.USER_OFFLINE)
  emitPresenceOffline(event: UserOfflineEvent) {
    console.log('User disconnected:', event.profileId);
    this.socketEmitter.emitToAll(WsPresenceEvents.ONLINE_STATE_CHANGED, {
      profileId: event.profileId,
      isOnline: false,
    });
  }

  @OnEvent(PresenceEvents.USER_ONLINE)
  emitPresenceOnline(event: UserOnlineEvent) {
    console.log('User connected:', event.profileId);
    this.socketEmitter.emitToAll(WsPresenceEvents.ONLINE_STATE_CHANGED, {
      profileId: event.profileId,
      isOnline: true,
    });
  }
}
