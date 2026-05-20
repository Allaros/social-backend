import { Injectable } from '@nestjs/common';
import { PresenceService } from '../services/presence.service';
import { PresenceStateService } from '../../websocket/services/presence-state.service';
import { OnEvent } from '@nestjs/event-emitter';
import { WsSystemEvents } from '@app/shared/events/ws-events';
import { WsDisconnectedEvent } from '@app/modules/websocket/events/ws-disconnected.event';

@Injectable()
export class WsPresenceConnectionListener {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly presenceStateService: PresenceStateService,
  ) {}

  @OnEvent(WsSystemEvents.DISCONNECTED)
  removeConnection(event: WsDisconnectedEvent) {
    setTimeout(() => {
      void this.handleDisconnect(event);
    }, 0);
  }

  private async handleDisconnect(event: WsDisconnectedEvent) {
    const isOnline = await this.presenceStateService.isOnline(event.profileId);

    if (!isOnline) {
      this.presenceService.emitOffline(event.profileId);
    }
  }
}
