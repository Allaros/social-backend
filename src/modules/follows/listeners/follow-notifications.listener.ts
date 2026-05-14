import {
  FollowingEvents,
  NotificationEvents,
} from '@app/shared/events/domain-events';
import { Injectable } from '@nestjs/common';
import EventEmitter2 from 'eventemitter2';
import { FollowingCreateEvent } from '../events/following-create.event';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationCreateEvent } from '@app/modules/notification/events/notification-create.event';
import { NotificationType } from '@app/modules/notification/types/notification.interface';
import { NotificationDeleteEvent } from '@app/modules/notification/events/notification-delete.event';
import { FollowingDeleteEvent } from '../events/following-delete.event';

@Injectable()
export class FollowNotificationsListener {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent(FollowingEvents.FOLLOWING_CREATED)
  createFollowingNotification(event: FollowingCreateEvent) {
    this.eventEmitter.emit(
      NotificationEvents.NOTIFICATION_CREATE,
      new NotificationCreateEvent({
        actorId: event.followerId,
        receiverId: event.followingId,
        type: NotificationType.FOLLOW,
      }),
    );
  }

  @OnEvent(FollowingEvents.FOLLOWING_DELETED)
  deleteFollowingNotification(event: FollowingDeleteEvent) {
    this.eventEmitter.emit(
      NotificationEvents.NOTIFICATION_DELETE,
      new NotificationDeleteEvent({
        actorId: event.followerId,
        receiverId: event.followingId,
        type: NotificationType.FOLLOW,
      }),
    );
  }
}
