import { Injectable } from '@nestjs/common';
import { DeleteNotificationByEventUseCase } from '../use-cases/delete-notification-by-event.usecase';
import { NotificationEvents } from '@app/shared/events/domain-events';
import { NotificationDeleteEvent } from '../events/notification-delete.event';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationDeleteListener {
  constructor(
    private readonly notificationDeleteByEventUseCase: DeleteNotificationByEventUseCase,
  ) {}

  @OnEvent(NotificationEvents.NOTIFICATION_DELETE)
  async deleteNotification(event: NotificationDeleteEvent) {
    await this.notificationDeleteByEventUseCase.execute({
      actorId: event.actorId,
      receiverId: event.receiverId,
      type: event.type,
      entityId: event.entityId,
      entityType: event.entityType,
    });
  }
}
