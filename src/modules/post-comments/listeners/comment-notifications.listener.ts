import { CommentLikeEvent } from '@app/modules/like/events/comment-like.event';
import { CommentUnlikeEvent } from '@app/modules/like/events/comment-unlike.event';
import { NotificationCreateEvent } from '@app/modules/notification/events/notification-create.event';
import { NotificationDeleteEvent } from '@app/modules/notification/events/notification-delete.event';
import {
  NotificationEntityType,
  NotificationType,
} from '@app/modules/notification/types/notification.interface';
import {
  CommentEvents,
  NotificationEvents,
} from '@app/shared/events/domain-events';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import EventEmitter2 from 'eventemitter2';
import { CommentCreateEvent } from '../events/comment-create.event';
import { CommentHardDeleteEvent } from '../events/comment-hard-delete.event';

@Injectable()
export class CommentNotificationsListener {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent(CommentEvents.COMMENT_LIKED)
  createCommentLikeNotifications(event: CommentLikeEvent) {
    this.eventEmitter.emit(
      NotificationEvents.NOTIFICATION_CREATE,
      new NotificationCreateEvent({
        actorId: event.actorId,
        receiverId: event.commentAuthorId,
        type: NotificationType.COMMENT_LIKE,
        entityId: event.commentId,
        entityType: NotificationEntityType.COMMENT,
        metadata: {
          textPreview: event.textPreview,
        },
      }),
    );
  }

  @OnEvent(CommentEvents.COMMENT_UNLIKED)
  deleteCommentLikeNotification(event: CommentUnlikeEvent) {
    this.eventEmitter.emit(
      NotificationEvents.NOTIFICATION_DELETE,
      new NotificationDeleteEvent({
        actorId: event.actorId,
        receiverId: event.commentAuthorId,
        type: NotificationType.COMMENT_LIKE,
        entityId: event.commentId,
        entityType: NotificationEntityType.COMMENT,
      }),
    );
  }

  @OnEvent(CommentEvents.COMMENT_CREATED)
  createCommentNotification(event: CommentCreateEvent) {
    const notificationPayload = {
      actorId: event.authorId,
      receiverId: event.parentId ? event.replyToUserId! : event.postAuthorId,
      type: event.parentId ? NotificationType.REPLY : NotificationType.COMMENT,
      entityId: event.parentId ? event.parentId : event.postId,
      entityType: event.parentId
        ? NotificationEntityType.COMMENT
        : NotificationEntityType.POST,
      metadata: {
        textPreview: event.textPreview,
      },
    };

    this.eventEmitter.emit(
      NotificationEvents.NOTIFICATION_CREATE,
      new NotificationCreateEvent(notificationPayload),
    );
  }

  @OnEvent(CommentEvents.COMMENT_HARD_DELETE)
  deleteCommentNotification(event: CommentHardDeleteEvent) {
    const isReply = !!event.parentId;

    const receiverId = isReply ? event.replyToUserId : event.postAuthorId;

    if (!receiverId || receiverId === event.authorId) return;

    this.eventEmitter.emit(
      NotificationEvents.NOTIFICATION_DELETE,
      new NotificationDeleteEvent({
        actorId: event.authorId,
        receiverId,
        type: isReply ? NotificationType.REPLY : NotificationType.COMMENT,
        entityId: isReply ? event.parentId : event.postId,
        entityType: isReply
          ? NotificationEntityType.COMMENT
          : NotificationEntityType.POST,
      }),
    );
  }
}
