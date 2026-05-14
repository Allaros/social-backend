import { Injectable } from '@nestjs/common';
import { PostCommentsService } from '../services/post-comments.service';
import { OnEvent } from '@nestjs/event-emitter';
import { CommentEvents } from '@app/shared/events/domain-events';
import { CommentCreateEvent } from '../events/comment-create.event';
import { CommentHardDeleteEvent } from '../events/comment-hard-delete.event';
import { CommentLikeEvent } from '@app/modules/like/events/comment-like.event';
import { CommentUnlikeEvent } from '@app/modules/like/events/comment-unlike.event';

@Injectable()
export class CommentCountersUdateListener {
  constructor(private readonly commentsService: PostCommentsService) {}

  @OnEvent(CommentEvents.COMMENT_CREATED)
  async incrementReplyCount(event: CommentCreateEvent) {
    if (event.parentId) {
      await this.commentsService.updateCounters(event.parentId, {
        repliesCount: 1,
      });
    }
  }

  @OnEvent(CommentEvents.COMMENT_HARD_DELETE)
  async decrementRepliesCount(event: CommentHardDeleteEvent) {
    if (event.parentId) {
      await this.commentsService.updateCounters(event.parentId, {
        repliesCount: -1,
      });
    }
  }

  @OnEvent(CommentEvents.COMMENT_LIKED)
  async incrementLikesCount(event: CommentLikeEvent) {
    await this.commentsService.updateCounters(event.commentId, {
      likesCount: 1,
    });
  }

  @OnEvent(CommentEvents.COMMENT_UNLIKED)
  async decrementLikesCount(event: CommentUnlikeEvent) {
    await this.commentsService.updateCounters(event.commentId, {
      likesCount: -1,
    });
  }
}
