export const PostEvents = {
  POST_HARD_DELETE: 'post.hardDelete',
  POST_CREATED: 'post.created',
  POST_LIKED: 'post.liked',
  POST_UNLIKED: 'post.unliked',
  POST_SAVED: 'post.saved',
  POST_UNSAVED: 'post.unsaved',
} as const;

export const CommentEvents = {
  COMMENT_HARD_DELETE: 'comment.hardDelete',
  COMMENT_CREATED: 'comment.created',
  COMMENT_LIKED: 'comment.liked',
  COMMENT_UNLIKED: 'comment.unliked',
} as const;

export const FollowingEvents = {
  FOLLOWING_CREATED: 'following.created',
  FOLLOWING_DELETED: 'following.deleted',
};

export const NotificationEvents = {
  NOTIFICATION_CREATE: 'notification.create',
  NOTIFICATION_DELETE: 'notification.delete',
  NOTIFICATION_STATE_CHANGED: 'notification.state.changed',
};

export const PresenceEvents = {
  USER_OFFLINE: 'presence.disconnect',
  USER_ONLINE: 'presence.connect',
};

export const MessagesEvents = {
  REALTIME_MESSAGE_CREATED: 'realtime.message.created',
  REALTIME_MESSAGE_DELETED: 'realtime.message.deleted',
  REALTIME_MESSAGE_READ: 'realtime.message.read',
  REALTIME_MESSAGE_EDITED: 'realtime.message.edited',
  MESSAGE_CREATED: 'message.created',
  MESSAGE_DELETED: 'message.deleted',
  MESSAGES_READ: 'messages.read',
  MESSAGE_EDITED: 'message.edited',
  MESSAGES_HIDED: 'messages.hided',
};

export const ChatEvents = {
  CHAT_MARKED_AS_DELETED: 'chat.marked.as.deleted',
  CHAT_GROUP_CREATED: 'chat.group-created',
  CHAT_UNREAD_STATE_CHANGED: 'chat.unread.state.changed',
  REALTIME_CHAT_STATE_UPDATED: 'realtime.chat.realtime.state.updated',
  CHAT_INITIALIZED: 'chat.initialized',
};
