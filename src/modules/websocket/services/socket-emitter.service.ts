import { Injectable, Inject } from '@nestjs/common';
import { WsRoomBuilder } from '../builders/ws-room.builder';
import { AppGateway } from '../gateways/app.gateway';

@Injectable()
export class SocketEmitterService {
  constructor(
    @Inject(AppGateway)
    private readonly gateway: AppGateway,
  ) {}

  emitToAll<T>(event: string, payload: T) {
    this.gateway.server.emit(event, payload);
  }

  emitToRoom<T>(room: string, event: string, payload: T) {
    this.gateway.server.to(room).emit(event, payload);
  }

  emitToProfile<T>(profileId: number, event: string, payload: T) {
    this.emitToRoom(WsRoomBuilder.profile(profileId), event, payload);
  }

  emitToNotifications<T>(profileId: number, event: string, payload: T) {
    this.emitToRoom(WsRoomBuilder.notifications(profileId), event, payload);
  }

  emitToDialogs(profileId: number, event: string, payload: unknown) {
    this.emitToRoom(WsRoomBuilder.dialogs(profileId), event, payload);
  }

  emitToChat(chatId: number, event: string, payload: unknown) {
    const room = WsRoomBuilder.chat(chatId);
    this.emitToRoom(room, event, payload);

    console.log('[EMIT CHAT]', {
      room,
      event,
    });
  }
}
