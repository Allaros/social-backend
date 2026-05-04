import { Injectable } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { DataSource } from 'typeorm';
import {
  NotificationEntityType,
  NotificationType,
} from '../types/notification.interface';

@Injectable()
export class DeleteNotificationByEventUseCase {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
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

      const metadata = notification.metadata ?? {};

      const aggregatedActors = metadata.aggregatedActors ?? [];

      const wasPresent = aggregatedActors.some((a) => a.actorId === actorId);

      if (!wasPresent) return;

      const nextActors = aggregatedActors.filter((a) => a.actorId !== actorId);

      const currentCount = metadata.aggregatedCount ?? aggregatedActors.length;

      const nextCount = Math.max(currentCount - 1, 0);

      if (nextCount <= 0 || nextActors.length === 0) {
        await this.notificationService.delete(notification.id, manager);

        return;
      }

      await this.notificationService.updateAggregation({
        notificationId: notification.id,
        aggregatedActors: nextActors,
        aggregatedCount: nextCount,
        metadata,
        manager,
      });
    });

    return { success: true };
  }
}
