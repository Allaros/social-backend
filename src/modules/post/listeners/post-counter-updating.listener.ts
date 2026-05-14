import { Injectable } from '@nestjs/common';
import { PostService } from '../services/post.service';
import { OnEvent } from '@nestjs/event-emitter';
import { CommentEvents, PostEvents } from '@app/shared/events/domain-events';
import { CommentCreateEvent } from '@app/modules/post-comments/events/comment-create.event';
import { CommentHardDeleteEvent } from '@app/modules/post-comments/events/comment-hard-delete.event';
import { PostSaveEvent } from '@app/modules/post-saving/events/post-save.event';
import { PostUnsaveEvent } from '@app/modules/post-saving/events/post-unsave.event';
import { PostLikeEvent } from '@app/modules/like/events/post-like.event';
import { PostUnlikeEvent } from '@app/modules/like/events/post-unlike.event';

@Injectable()
export class PostCountUpdatingListener {
  constructor(private readonly postService: PostService) {}

  @OnEvent(CommentEvents.COMMENT_CREATED)
  async incrementCommentCounter(event: CommentCreateEvent) {
    if (!event.parentId) {
      await this.postService.updateCounters(event.postId, {
        commentsCount: 1,
      });
    }
  }

  @OnEvent(CommentEvents.COMMENT_HARD_DELETE)
  async decrementCommentCounter(event: CommentHardDeleteEvent) {
    if (!event.parentId) {
      await this.postService.updateCounters(event.postId, {
        commentsCount: -1,
      });
    }
  }

  @OnEvent(PostEvents.POST_SAVED)
  async incrementSavesCounter(event: PostSaveEvent) {
    await this.postService.updateCounters(event.postId, { savingsCount: 1 });
  }

  @OnEvent(PostEvents.POST_UNSAVED)
  async decrementSavesCounter(event: PostUnsaveEvent) {
    await this.postService.updateCounters(event.postId, { savingsCount: -1 });
  }

  @OnEvent(PostEvents.POST_LIKED)
  async incrementLikesCount(event: PostLikeEvent) {
    await this.postService.updateCounters(event.postId, {
      likesCount: 1,
    });
  }

  @OnEvent(PostEvents.POST_UNLIKED)
  async decrementLikesCount(event: PostUnlikeEvent) {
    await this.postService.updateCounters(event.postId, {
      likesCount: -1,
    });
  }
}
