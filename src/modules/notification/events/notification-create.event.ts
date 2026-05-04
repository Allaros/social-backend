import {
  NotificationEntityType,
  NotificationType,
} from '../types/notification.interface';

export class NotificationCreateEvent {
  constructor(
    public readonly actorId: number,
    public readonly receiverId: number,
    public readonly type: NotificationType,
    public readonly entityId?: number,
    public readonly entityType?: NotificationEntityType,
  ) {}
}
