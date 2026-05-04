import { Injectable } from '@nestjs/common';
import {
  BuildNotificationFeedPayload,
  NotificationAggregatedField,
  NotificationFeedItem,
} from '../types/notification.interface';
import { ProfileEntity } from '@app/modules/profile/profile.entity';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationResponseBuilder {
  buildFeed({
    aggregatedActors,
    nextCursor,
    notifications,
  }: BuildNotificationFeedPayload) {
    const actorMap = new Map(
      aggregatedActors.map((actor) => [actor.id, actor]),
    );

    const items: NotificationFeedItem[] = notifications.map((notification) => {
      return {
        id: notification.id,
        type: notification.type,
        isRead: notification.isRead,
        isSeen: notification.isSeen,
        createdAt: notification.createdAt,

        actor: {
          id: notification.actor.id,
          username: notification.actor.username,
          name: notification.actor.name,
          avatarUrl: notification.actor.avatarUrl,
        },

        aggregated: this.buildAggregatedField(notification, actorMap),

        textPreview: notification.metadata?.textPreview,
        imagePreview: notification.metadata?.imagePreview,
        aggregationType: notification.metadata?.type,
      };
    });

    return {
      items,
      nextCursor,
    };
  }

  private buildAggregatedField(
    notification: NotificationEntity,
    actorMap: Map<number, ProfileEntity>,
  ): NotificationAggregatedField | undefined {
    const aggregatedActors = notification.metadata?.aggregatedActors ?? [];

    if (!aggregatedActors.length) return undefined;

    const aggregatedCount =
      notification.metadata?.aggregatedCount ?? aggregatedActors.length;

    const aggregationType = notification.metadata?.type ?? 'count';

    const actors = aggregatedActors
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .map((a) => {
        const profile = actorMap.get(a.actorId);
        if (!profile) return null;

        return {
          id: profile.id,
          username: profile.username,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
          createdAt: a.createdAt,
        };
      })
      .filter((a): a is NonNullable<typeof a> => Boolean(a));

    return {
      count: aggregatedCount,
      type: aggregationType !== 'none' ? aggregationType : 'count',
      actors,
    };
  }
}
