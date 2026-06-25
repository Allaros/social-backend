import { Injectable } from '@nestjs/common';
import { PresenceService } from '../services/presence.service';
import { OnEvent } from '@nestjs/event-emitter';
import { WsSystemEvents } from '@app/shared/events/ws-events';
import { WsDisconnectedEvent } from '@app/modules/websocket/events/ws-disconnected.event';

@Injectable()
export class WsPresenceConnectionListener {
  constructor(private readonly presenceService: PresenceService) {}

  @OnEvent(WsSystemEvents.DISCONNECTED)
  handle(event: WsDisconnectedEvent) {
    this.presenceService.emitOffline(event.profileId);
  }
}
