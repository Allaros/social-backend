import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FollowsService } from '../services/follows.service';
import { ProfileService } from '@app/modules/profile/services/profile.service';
import { isUniqueViolation } from '@app/shared/handlers/db-error';
import EventEmitter2 from 'eventemitter2';
import {
  FollowingEvents,
  NotificationEvents,
} from '@app/shared/events/domain-events';
import { FollowingCreateEvent } from '../events/following-create.event';
import { NotificationCreateEvent } from '@app/modules/notification/events/notification-create.event';
import { NotificationType } from '@app/modules/notification/types/notification.interface';

type CreateFollowPayload = {
  followerId: number;
  followingId: number;
};

@Injectable()
export class CreateFollowingUseCase {
  constructor(
    private readonly followsService: FollowsService,
    private readonly profileService: ProfileService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(payload: CreateFollowPayload) {
    const { followerId, followingId } = payload;

    if (followerId === followingId)
      throw new BadRequestException('Нельзя подписаться на самого себя');

    const followingProfile = await this.profileService.findById(followingId);

    if (!followingProfile) throw new NotFoundException('Профиль не найден');

    try {
      await this.followsService.create(followerId, followingId);
    } catch (err) {
      if (isUniqueViolation(err)) return { success: true };

      throw err;
    }

    this.eventEmitter.emit(
      FollowingEvents.FOLLOWING_CREATED,
      new FollowingCreateEvent(followerId, followingId),
    );

    this.eventEmitter.emit(
      NotificationEvents.NOTIFICATION_CREATE,
      new NotificationCreateEvent(
        followerId,
        followingId,
        NotificationType.FOLLOW,
      ),
    );

    return { success: true };
  }
}
