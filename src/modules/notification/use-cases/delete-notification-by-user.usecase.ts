import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import EventEmitter2 from 'eventemitter2';
import { ProfileService } from '@app/modules/profile/services/profile.service';
import { NotificationEvents } from '@app/shared/events/domain-events';
import { NotificationStateChangedEvent } from '../events/notification-state-changed.event';

@Injectable()
export class DeleteNotificationByUserUseCase {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
    private readonly profileService: ProfileService,
  ) {}

  async execute(notificationId: number, profileId: number) {
    const existingNotification =
      await this.notificationService.findById(notificationId);

    const profile = await this.profileService.findById(profileId);

    if (!profile) throw new NotFoundException('Не удается найти профиль');

    if (!existingNotification)
      throw new NotFoundException(
        'Не удается найти уведомление. Возможно оно уже было удалено',
      );

    if (existingNotification.receiverId !== profileId)
      throw new ForbiddenException('Вы не можете удалить чужое уведомление');

    await this.notificationService.delete(notificationId);

    const unseenCount = existingNotification.isSeen
      ? profile.unseenNotificationsCount
      : (
          await this.profileService.updateCountersAndReturn(
            profileId,
            { unseenNotificationsCount: -1 },
            ['unseenNotificationsCount'],
          )
        ).unseenNotificationsCount;

    this.eventEmitter.emit(
      NotificationEvents.NOTIFICATION_STATE_CHANGED,
      new NotificationStateChangedEvent({
        hasUnseen: unseenCount > 0,
        receiverId: profileId,
        type: 'deleted',
        unseenCount,
        notificationIds: [notificationId],
      }),
    );

    return { success: true };
  }
}
