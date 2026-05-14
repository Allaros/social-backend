import { UserEntity } from '@app/modules/user/user.entity';
import {
  WsNotificationEvents,
  WsPresenceEvents,
} from '@app/shared/events/ws-events';
import { Socket } from 'socket.io';

export interface ServerToClientEvents {
  'auth.expired': () => void;

  [WsPresenceEvents.ONLINE_STATE_CHANGED]: (payload: {
    profileId: number;
    isOnline: boolean;
  }) => void;

  [WsNotificationEvents.CREATED]: (payload: unknown) => void;

  [WsNotificationEvents.UPDATED]: (payload: unknown) => void;

  [WsNotificationEvents.DELETED]: (payload: unknown) => void;
}

export type SocketData = {
  user: UserEntity;
};

export type AppSocket = Socket<
  Record<string, never>,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export enum WsRoom {
  NOTIFICATIONS = 'notifications',
  MESSAGES = 'messages',
  PROFILE = 'profile',
}
