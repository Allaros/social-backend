import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { ProfileService } from '@app/modules/profile/services/profile.service';

@Injectable()
export class GetCountersUseCase {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly profileService: ProfileService,
  ) {}

  async execute(profileId: number) {
    const profile = await this.profileService.findById(profileId);

    if (!profile) {
      throw new NotFoundException('Профиль не найден');
    }

    const unseenNotificationsCount =
      await this.notificationService.countUnseenByProfileId(profileId);

    const diff = unseenNotificationsCount - profile.unseenNotificationsCount;

    if (diff !== 0) {
      await this.profileService.updateCounters(profileId, {
        unseenNotificationsCount: diff,
      });
    }

    return {
      receiverId: profileId,
      unseenCount: unseenNotificationsCount,
      hasUnseen: unseenNotificationsCount > 0,
    };
  }
}
