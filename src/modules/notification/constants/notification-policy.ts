import {
  AggregationType,
  NotificationType,
} from '../types/notification.interface';

type PolicyType = {
  importance: 'low' | 'medium' | 'high';
  category: 'social' | 'engagement' | 'message';
  allowSelf: boolean;
  dedup?: number;
  aggregate?: AggregationType;
};

export const notificationPolicy: Record<NotificationType, PolicyType> = {
  [NotificationType.FOLLOW]: {
    importance: 'medium',
    category: 'social',
    allowSelf: false,
    dedup: 5 * 60 * 1000,
    aggregate: 'actors',
  },

  [NotificationType.COMMENT]: {
    importance: 'high',
    category: 'message',
    allowSelf: false,
    aggregate: 'count',
  },

  [NotificationType.COMMENT_LIKE]: {
    importance: 'low',
    category: 'engagement',
    allowSelf: false,
    aggregate: 'actors',
  },

  [NotificationType.POST_LIKE]: {
    importance: 'low',
    category: 'engagement',
    allowSelf: false,
    aggregate: 'actors',
  },

  [NotificationType.REPLY]: {
    importance: 'high',
    category: 'message',
    allowSelf: false,
    aggregate: 'none',
  },

  [NotificationType.REPOST]: {
    importance: 'medium',
    category: 'engagement',
    allowSelf: false,
    aggregate: 'actors',
  },
};
