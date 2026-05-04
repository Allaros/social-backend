import { ProfileEntity } from '@app/modules/profile/profile.entity';
import { NotificationEntity } from '../entities/notification.entity';

export enum NotificationType {
  FOLLOW = 'follow',
  POST_LIKE = 'post_like',
  COMMENT_LIKE = 'comment_like',
  COMMENT = 'comment',
  REPLY = 'reply',
  REPOST = 'repost',
}

export enum NotificationEntityType {
  POST = 'post',
  COMMENT = 'comment',
}

export type AggregatedActor = {
  actorId: number;
  createdAt: string;
};

export type AggregationType = 'none' | 'actors' | 'count';

export type NotificationMetadata = {
  aggregatedCount?: number;
  aggregatedActors?: AggregatedActor[];
  type?: AggregationType;

  textPreview?: string;

  imagePreview?: string;
};

export type NotificationCursor = {
  createdAt: number;
  id: number;
};

export type NotificationActorType = {
  id: number;
  username: string;
  name: string;
  avatarUrl?: string;
  createdAt?: string;
};

export type NotificationFeedItem = {
  id: number;
  type: NotificationType;
  isRead: boolean;
  isSeen: boolean;
  createdAt: Date;
  actor: NotificationActorType;

  aggregated?: NotificationAggregatedField;

  textPreview?: string;
  imagePreview?: string;
  aggregationType?: AggregationType;
};

export type NotificationAggregatedField = {
  count: number;
  actors: NotificationActorType[];
  type: 'count' | 'actors';
};

export type BuildNotificationFeedPayload = {
  notifications: NotificationEntity[];
  aggregatedActors: ProfileEntity[];
  nextCursor: string | null;
};
