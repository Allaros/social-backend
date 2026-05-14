import { Injectable } from '@nestjs/common';
import { PresenceService } from '../services/presence.service';
import { OnEvent } from '@nestjs/event-emitter';
import { WsSystemEvents } from '@app/shared/events/ws-events';
import { WsConnectedEvent } from '@app/modules/websocket/events/ws-connected.event';
import { WsDisconnectedEvent } from '@app/modules/websocket/events/ws-disconnected.event';

@Injectable()
export class WsPresenceConnectionListener {
  constructor(private readonly presenceService: PresenceService) {}

  @OnEvent(WsSystemEvents.CONNECTED)
  async createConnection(event: WsConnectedEvent) {
    await this.presenceService.connect(event.profileId, event.client.id);
  }

  @OnEvent(WsSystemEvents.DISCONNECTED)
  async removeConnection(event: WsDisconnectedEvent) {
    await this.presenceService.disconnect(event.profileId, event.client.id);
  }
}
