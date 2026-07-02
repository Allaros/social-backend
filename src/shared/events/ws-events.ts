export const WsNotificationEvents = {
  CREATED: 'notification.created',
  UPDATED: 'notification.updated',
  DELETED: 'notification.deleted',
};

export const WsPresenceEvents = {
  ONLINE_STATE_CHANGED: 'presence.online.state.changed',
};

export const WsSystemEvents = {
  CONNECTED: 'websocket.connected',
  DISCONNECTED: 'websocket.disconnected',
};

export const WsChatEvents = {
  UNREAD_STATE_CHANGED: 'unread.state.changed',
  CHAT_STATE_UPDATED: 'chat.state.updated',
  CHAT_CREATED: 'chat.created',
  CHAT_DELETED: 'chat.deleted',
};

export const WsMessageEvents = {
  REALTIME_MESSAGE_CREATED: 'realtime.message.created',
  REALTIME_MESSAGE_DELETED: 'realtime.message.deleted',
  REALTIME_MESSAGE_READ: 'realtime.message.read',
  REALTIME_MESSAGE_EDITED: 'realtime.message.edited',
};
