import { Injectable } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { NotificationEvents } from '@app/shared/events/domain-events';
import { NotificationStateChangedEvent } from '../events/notification-state-changed.event';
import { ProfileService } from '@app/modules/profile/services/profile.service';
import EventEmitter2 from 'eventemitter2';

@Injectable()
export class SetNotificationsSeenUseCase {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly profileService: ProfileService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(notificationIds: number[], profileId: number) {
    if (!notificationIds.length) return;

    await this.notificationService.markAsSeen(notificationIds);

    const seenCount = notificationIds.length;

    const unseenCount = await this.profileService.updateCountersAndReturn(
      profileId,
      { unseenNotificationsCount: -seenCount },
      ['unseenNotificationsCount'],
    );

    this.eventEmitter.emit(
      NotificationEvents.NOTIFICATION_STATE_CHANGED,
      new NotificationStateChangedEvent({
        hasUnseen: unseenCount.unseenNotificationsCount > 0,
        receiverId: profileId,
        type: 'updated',
        unseenCount: unseenCount.unseenNotificationsCount,
        notificationIds,
      }),
    );
  }
}
