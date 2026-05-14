import { NotificationStateChangedEventProps } from '../types/notification.interface';

export class NotificationStateChangedEvent {
  public readonly type: 'created' | 'updated' | 'deleted';
  public readonly receiverId: number;
  public readonly unseenCount: number;
  public readonly hasUnseen: boolean;
  public readonly notificationIds: number[];
  constructor(props: NotificationStateChangedEventProps) {
    Object.assign(this, props);
  }
}
