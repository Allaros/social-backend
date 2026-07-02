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

  static presence(profileId: number) {
    return `${WsRoom.PRESENCE}:${profileId}`;
  }

  static dialogs(profileId: number) {
    return `dialogs:${profileId}`;
  }

  static chat(chatId: number) {
    return `chat:${chatId}`;
  }
}
