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
};
