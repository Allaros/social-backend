import { AppGateway } from '@app/modules/websocket/gateways/app.gateway';
import { Injectable } from '@nestjs/common';
import { WsRoomBuilder } from '../builders/ws-room.builder';

@Injectable()
export class PresenceStateService {
  constructor(private readonly gateway: AppGateway) {}

  async getConnectionsCount(profileId: number) {
    const sockets = await this.gateway.server
      .in(WsRoomBuilder.presence(profileId))
      .fetchSockets();

    return sockets.length;
  }

  async getOnlineStatuses(profileIds: number[]) {
    const map = new Map<number, boolean>();

    await Promise.all(
      profileIds.map(async (profileId) => {
        map.set(profileId, await this.isOnline(profileId));
      }),
    );

    return map;
  }

  async isOnline(profileId: number) {
    return (await this.getConnectionsCount(profileId)) > 0;
  }
}
