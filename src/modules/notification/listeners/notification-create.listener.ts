import { Injectable } from '@nestjs/common';
import { CreateNotificationUseCase } from '../use-cases/create-notification.usecase';
import { NotificationEvents } from '@app/shared/events/domain-events';
import { NotificationCreateEvent } from '../events/notification-create.event';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationCreateListener {
  constructor(
    private readonly notificationCreateUseCase: CreateNotificationUseCase,
  ) {}

  @OnEvent(NotificationEvents.NOTIFICATION_CREATE)
  async createNotification(event: NotificationCreateEvent) {
    await this.notificationCreateUseCase.execute({
      actorId: event.actorId,
      receiverId: event.receiverId,
      type: event.type,
      entityId: event.entityId,
      entityType: event.entityType,
      metadata: event.metadata,
    });
  }
}
