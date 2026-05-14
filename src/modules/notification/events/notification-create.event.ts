import {
  NotificationEntityType,
  NotificationType,
} from '../types/notification.interface';

type NotificationCreatePayload = {
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

export class NotificationCreateEvent {
  public readonly actorId: number;
  public readonly receiverId: number;
  public readonly type: NotificationType;
  public readonly entityId?: number;
  public readonly entityType?: NotificationEntityType;
  public readonly metadata?: {
    textPreview?: string;
    imagePreview?: string;
  };
  constructor(props: NotificationCreatePayload) {
    Object.assign(this, props);
  }
}
