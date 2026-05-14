import { WsRoom } from '../types/ws.types';

export class WsRoomBuilder {
  static notifications(profileId: number) {
    return `${WsRoom.NOTIFICATIONS}:${profileId}`;
  }

  static profile(profileId: number) {
    return `${WsRoom.PROFILE}:${profileId}`;
  }

  static messages(profileId: number) {
    return `${WsRoom.MESSAGES}:${profileId}`;
  }
}
