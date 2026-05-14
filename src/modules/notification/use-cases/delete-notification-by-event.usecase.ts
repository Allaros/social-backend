import { Injectable } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { DataSource } from 'typeorm';
import {
  NotificationEntityType,
  NotificationType,
} from '../types/notification.interface';
import EventEmitter2 from 'eventemitter2';
import { ProfileService } from '@app/modules/profile/services/profile.service';
import { NotificationEvents } from '@app/shared/events/domain-events';
import { NotificationStateChangedEvent } from '../events/notification-state-changed.event';

@Injectable()
export class DeleteNotificationByEventUseCase {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly profileService: ProfileService,
  ) {}

  async execute({
    actorId,
    receiverId,
    type,
    entityId,
    entityType,
  }: {
    receiverId: number;
    actorId: number;
    type: NotificationType;
    entityId?: number;
    entityType?: NotificationEntityType;
  }) {
    await this.dataSource.transaction(async (manager) => {
      const notification = await this.notificationService.lockAggregationTarget(
        {
          manager,
          receiverId,
          type,
          entityId,
          entityType,
        },
      );

      if (!notification) return;

      const receiver = await this.profileService.findById(receiverId);

      if (!receiver) return;

      const notificationId = notification.id;

      const metadata = notification.metadata ?? {};

      const aggregatedActors = metadata.aggregatedActors ?? [];

      const wasPresent = aggregatedActors.some((a) => a.actorId === actorId);

      if (!wasPresent) return;

      const nextActors = aggregatedActors.filter((a) => a.actorId !== actorId);

      const currentCount = metadata.aggregatedCount ?? aggregatedActors.length;

      const nextCount = Math.max(currentCount - 1, 0);

      if (nextCount <= 0 || nextActors.length === 0) {
        await this.notificationService.delete(notification.id, manager);
        let unseenCount = 0;

        if (!notification.isSeen) {
          const counters = await this.profileService.updateCountersAndReturn(
            receiverId,
            { unseenNotificationsCount: -1 },
            ['unseenNotificationsCount'],
          );

          unseenCount = counters.unseenNotificationsCount;
        }

        this.eventEmitter.emit(
          NotificationEvents.NOTIFICATION_STATE_CHANGED,
          new NotificationStateChangedEvent({
            receiverId,
            type: 'deleted',
            hasUnseen: unseenCount > 0,
            unseenCount,
            notificationIds: [notificationId],
          }),
        );

        return;
      }

      await this.notificationService.updateAggregation({
        notificationId: notification.id,
        aggregatedActors: nextActors,
        aggregatedCount: nextCount,
        metadata,
        manager,
      });

      this.eventEmitter.emit(
        NotificationEvents.NOTIFICATION_STATE_CHANGED,
        new NotificationStateChangedEvent({
          receiverId,
          type: 'updated',
          hasUnseen: receiver.unseenNotificationsCount > 0,
          unseenCount: receiver.unseenNotificationsCount,
          notificationIds: [notificationId],
        }),
      );
    });

    return { success: true };
  }
}
