import { UserService } from '@app/modules/user/user.service';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { authenticateSocket } from '../helpers/websocket-auth.helper';
import { AppSocket } from '../types/ws.types';
import { WsRoomBuilder } from '../builders/ws-room.builder';
import EventEmitter2 from 'eventemitter2';
import { WsSystemEvents } from '@app/shared/events/ws-events';
import { WsDisconnectedEvent } from '../events/ws-disconnected.event';
import { UnauthorizedException } from '@nestjs/common';
import { UserOnlineEvent } from '@app/modules/presence/events/user-online.event';
import { PresenceEvents } from '@app/shared/events/domain-events';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 20000,
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handleConnection(client: AppSocket) {
    try {
      const user = await authenticateSocket({
        client,
        configService: this.configService,
        userService: this.userService,
      });

      client.data.user = user;

      const profileId = user.profile.id;

      await Promise.all([
        client.join(WsRoomBuilder.notifications(profileId)),
        client.join(WsRoomBuilder.profile(profileId)),
        client.join(WsRoomBuilder.presence(profileId)),
      ]);

      const sockets = await this.server
        .in(WsRoomBuilder.presence(profileId))
        .fetchSockets();

      if (sockets.length === 1) {
        this.eventEmitter.emit(
          PresenceEvents.USER_ONLINE,
          new UserOnlineEvent(profileId),
        );
      }

      console.log('[WS CONNECT]', {
        profileId: user.profile.id,
        socketId: client.id,
      });
    } catch (err) {
      console.log(err);

      if (err instanceof UnauthorizedException) {
        client.emit('auth.expired');
      }

      client.disconnect(true);
    }
  }

  handleDisconnect(client: AppSocket) {
    const user = client.data.user;

    if (!user) return;

    this.eventEmitter.emit(
      WsSystemEvents.DISCONNECTED,
      new WsDisconnectedEvent(client, user.profile.id),
    );

    console.log('[WS DISCONNECT]', {
      profileId: user.profile.id,
      socketId: client.id,
    });
  }
}
