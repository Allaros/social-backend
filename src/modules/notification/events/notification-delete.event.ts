import {
  NotificationEntityType,
  NotificationType,
} from '../types/notification.interface';

type NotificationDeletePayload = {
  actorId: number;
  receiverId: number;
  type: NotificationType;
  entityId?: number;
  entityType?: NotificationEntityType;
};

export class NotificationDeleteEvent {
  public readonly actorId: number;
  public readonly receiverId: number;
  public readonly type: NotificationType;
  public readonly entityId?: number;
  public readonly entityType?: NotificationEntityType;
  constructor(props: NotificationDeletePayload) {
    Object.assign(this, props);
  }
}
