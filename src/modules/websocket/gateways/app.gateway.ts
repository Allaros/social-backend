/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PresenceCacheService } from '../services/presence-cache.service';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@app/modules/user/user.service';
import EventEmitter2 from 'eventemitter2';
import { AppSocket } from '../types/ws.types';
import { authenticateSocket } from '../helpers/websocket-auth.helper';
import { WsRoomBuilder } from '../builders/ws-room.builder';
import { UserOnlineEvent } from '@app/modules/presence/events/user-online.event';
import { PresenceEvents } from '@app/shared/events/domain-events';
import { UnauthorizedException } from '@nestjs/common';
import { WsSystemEvents } from '@app/shared/events/ws-events';
import { WsDisconnectedEvent } from '../events/ws-disconnected.event';
import { Server, Socket } from 'socket.io';

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
    private readonly presenceCacheService: PresenceCacheService,
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
        client.join(WsRoomBuilder.dialogs(profileId)),
      ]);

      const connections =
        await this.presenceCacheService.incrementConnections(profileId);

      if (connections === 1) {
        this.eventEmitter.emit(
          PresenceEvents.USER_ONLINE,
          new UserOnlineEvent(profileId),
        );
      }

      console.log('[WS CONNECT]', {
        profileId,
        socketId: client.id,
        connections,
      });
    } catch (err) {
      console.log(err);

      if (err instanceof UnauthorizedException) {
        client.emit('auth.expired');
      }

      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AppSocket) {
    const user = client.data.user;

    if (!user) {
      return;
    }

    const profileId = user.profile.id;

    const connections =
      await this.presenceCacheService.decrementConnections(profileId);

    if (connections === 0) {
      this.eventEmitter.emit(
        WsSystemEvents.DISCONNECTED,
        new WsDisconnectedEvent(client, profileId),
      );
    }

    console.log('[WS DISCONNECT]', {
      profileId,
      socketId: client.id,
      connections,
    });
  }

  @SubscribeMessage('chat:join')
  async joinChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: { chatId: number },
  ) {
    const room = WsRoomBuilder.chat(dto.chatId);

    await socket.join(room);

    console.log('[CHAT JOIN]', {
      socketId: socket.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      profileId: socket.data.user.profile.id,
      room,
    });
  }

  @SubscribeMessage('chat:leave')
  async leaveChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: { chatId: number },
  ) {
    const room = WsRoomBuilder.chat(dto.chatId);
    await socket.leave(room);

    console.log('[CHAT LEAVE]', {
      socketId: socket.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      profileId: socket.data.user.profile.id,
      room,
    });
  }
}
