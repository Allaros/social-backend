import { Injectable } from '@nestjs/common';
import { LikeService } from '../services/like.service';
import { OnEvent } from '@nestjs/event-emitter';
import { PostHardDeleteEvent } from '@app/modules/post/events/post-hard-delete.event';
import { LikeTargetType } from '../types/like.interface';
import { CommentEvents, PostEvents } from '@app/shared/events/domain-events';
import { CommentHardDeleteEvent } from '@app/modules/post-comments/events/comment-hard-delete.event';

@Injectable()
export class PostLikeCleanupListener {
  constructor(private readonly likeService: LikeService) {}

  @OnEvent(PostEvents.POST_HARD_DELETE)
  async handlePostDeleted(event: PostHardDeleteEvent) {
    await this.likeService.deleteByTarget({
      targetId: event.postId,
      targetType: LikeTargetType.POST,
    });
  }

  @OnEvent(CommentEvents.COMMENT_HARD_DELETE)
  async handleCommentDeleted(event: CommentHardDeleteEvent) {
    await this.likeService.deleteByTarget({
      targetId: event.commentId,
      targetType: LikeTargetType.POST,
    });
  }
}
