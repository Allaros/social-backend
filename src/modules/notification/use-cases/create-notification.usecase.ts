import { Injectable } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import {
  NotificationEntityType,
  NotificationType,
} from '../types/notification.interface';
import { notificationPolicy } from '../constants/notification-policy';
import { DataSource } from 'typeorm';

type CreateNotificationPayload = {
  actorId: number;
  receiverId: number;
  type: NotificationType;
  entityId?: number;
  entityType?: NotificationEntityType;
};

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(payload: CreateNotificationPayload) {
    const { actorId, receiverId, type, entityId, entityType } = payload;

    const policy = notificationPolicy[type];

    if (!policy.allowSelf && actorId === receiverId)
      return { ststus: 'skipped' };

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

        return { status: 'aggregated' };
      }
    }

    await this.notificationService.create({
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
            }
          : undefined,
    });

    return { status: 'created' };
  }
}
