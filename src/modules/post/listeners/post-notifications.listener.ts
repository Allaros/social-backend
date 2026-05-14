import { PostLikeEvent } from '@app/modules/like/events/post-like.event';
import { PostUnlikeEvent } from '@app/modules/like/events/post-unlike.event';
import { NotificationCreateEvent } from '@app/modules/notification/events/notification-create.event';
import { NotificationDeleteEvent } from '@app/modules/notification/events/notification-delete.event';
import {
  NotificationEntityType,
  NotificationType,
} from '@app/modules/notification/types/notification.interface';
import {
  NotificationEvents,
  PostEvents,
} from '@app/shared/events/domain-events';
import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class PostNotificationsListener {
  constructor(private readonly eventEmmiter: EventEmitter2) {}

  @OnEvent(PostEvents.POST_LIKED)
  createPostLikeNotification(event: PostLikeEvent) {
    this.eventEmmiter.emit(
      NotificationEvents.NOTIFICATION_CREATE,
      new NotificationCreateEvent({
        actorId: event.actorId,
        receiverId: event.postAuthorId,
        type: NotificationType.POST_LIKE,
        entityId: event.postId,
        entityType: NotificationEntityType.POST,
        metadata: {
          imagePreview: event.imagePreview,
          textPreview: event.textPreview,
        },
      }),
    );
  }

  @OnEvent(PostEvents.POST_UNLIKED)
  deletePostLikeNotification(event: PostUnlikeEvent) {
    this.eventEmmiter.emit(
      NotificationEvents.NOTIFICATION_DELETE,
      new NotificationDeleteEvent({
        actorId: event.actorId,
        receiverId: event.postAuthorId,
        type: NotificationType.POST_LIKE,
        entityType: NotificationEntityType.POST,
        entityId: event.postId,
      }),
    );
  }
}
