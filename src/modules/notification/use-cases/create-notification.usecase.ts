import { Injectable } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import {
  NotificationEntityType,
  NotificationType,
} from '../types/notification.interface';
import { notificationPolicy } from '../constants/notification-policy';
import { DataSource } from 'typeorm';
import EventEmitter2 from 'eventemitter2';
import { NotificationEvents } from '@app/shared/events/domain-events';
import { NotificationStateChangedEvent } from '../events/notification-state-changed.event';
import { ProfileService } from '@app/modules/profile/services/profile.service';

type CreateNotificationPayload = {
  actorId: number;
  receiverId: number;
  type: NotificationType;
  entityId?: number;
  entityType?: NotificationEntityType;
  metadata?: {
    textPreview?: string;
    imagePreview?: string;
  };
};

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly profileService: ProfileService,
  ) {}

  async execute(payload: CreateNotificationPayload) {
    const { actorId, receiverId, type, entityId, entityType, metadata } =
      payload;

    const policy = notificationPolicy[type];

    const receiver = await this.profileService.findById(receiverId);

    if (!receiver) return { status: 'skipped' };

    if (!policy.allowSelf && actorId === receiverId)
      return { status: 'skipped' };

    if (policy.dedup) {
      const duplicate = await this.notificationService.findRecentDuplicate({
        actorId,
        receiverId,
        type,
        entityId,
        entityType,
        dedupMs: policy.dedup,
      });

      if (duplicate) return { status: 'skipped' };
    }

    if (policy.aggregate !== 'none') {
      const existing = await this.notificationService.findAggregateTarget({
        receiverId,
        type,
        entityId,
        entityType,
      });

      if (existing) {
        await this.dataSource.transaction(async (manager) => {
          await this.notificationService.incrementAggregation({
            notificationId: existing.id,
            actorId,
            manager,
          });
        });

        this.eventEmitter.emit(
          NotificationEvents.NOTIFICATION_STATE_CHANGED,
          new NotificationStateChangedEvent({
            hasUnseen: true,
            receiverId,
            type: 'updated',
            unseenCount: receiver.unseenNotificationsCount,
            notificationIds: [existing.id],
          }),
        );

        return { status: 'aggregated' };
      }
    }

    const result = await this.notificationService.create({
      actorId,
      receiverId,
      type,
      entityId,
      entityType,
      metadata:
        policy.aggregate !== 'none'
          ? {
              aggregatedCount: 1,
              aggregatedActors: [
                { actorId, createdAt: new Date().toISOString() },
              ],
              type: policy.aggregate,
              textPreview: metadata?.textPreview,
              imagePreview: metadata?.imagePreview,
            }
          : {
              textPreview: metadata?.textPreview,
              imagePreview: metadata?.imagePreview,
            },
    });

    const newNotificationId = result.identifiers[0].id as number;

    const unseenCount = await this.profileService.updateCountersAndReturn(
      receiverId,
      { unseenNotificationsCount: 1 },
      ['unseenNotificationsCount'],
    );

    this.eventEmitter.emit(
      NotificationEvents.NOTIFICATION_STATE_CHANGED,
      new NotificationStateChangedEvent({
        hasUnseen: true,
        receiverId,
        type: 'created',
        unseenCount: unseenCount.unseenNotificationsCount,
        notificationIds: [newNotificationId],
      }),
    );

    return { status: 'created' };
  }
}
