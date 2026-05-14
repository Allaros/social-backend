import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LikeService } from '../services/like.service';
import { LikeTargetResult, LikeTargetType } from '../types/like.interface';
import EventEmitter2 from 'eventemitter2';
import { CommentEvents, PostEvents } from '@app/shared/events/domain-events';
import { PostLikeEvent } from '../events/post-like.event';
import { CommentLikeEvent } from '../events/comment-like.event';
import { PostService } from '@app/modules/post/services/post.service';
import { PostCommentsService } from '@app/modules/post-comments/services/post-comments.service';

@Injectable()
export class CreateLikeUseCase {
  constructor(
    private readonly likeService: LikeService,
    private readonly eventEmitter: EventEmitter2,
    private readonly postService: PostService,
    private readonly commentService: PostCommentsService,
  ) {}

  private handlers: Record<
    LikeTargetType,
    (targetId: number) => Promise<LikeTargetResult>
  > = {
    [LikeTargetType.POST]: async (targetId) => {
      const post = await this.postService.findById(targetId);

      if (!post) {
        throw new NotFoundException('Пост не найден. Возможно, он был удален.');
      }

      const normalizedPreview =
        this.stripHtml(post.content)?.trim()?.slice(0, 20) || 'Пост без текста';

      return {
        entityId: post.id,
        entityType: LikeTargetType.POST,
        receiverId: post.profileId,
        textPreview: normalizedPreview,
        imagePreview: post.media?.[0].url ?? null,
      };
    },

    [LikeTargetType.COMMENT]: async (targetId) => {
      const comment = await this.commentService.findById(targetId);

      if (!comment) {
        throw new NotFoundException(
          'Комментарий не найден. Возможно, он был удален.',
        );
      }

      const normalizedPreview =
        comment.content?.trim()?.slice(0, 20) || 'Комментарий';

      return {
        entityId: comment.id,
        entityType: LikeTargetType.COMMENT,
        receiverId: comment.profileId,
        textPreview: normalizedPreview,
      };
    },
  };

  async execute(
    targetId: number,
    currentProfileId: number,
    targetType: LikeTargetType,
  ) {
    const existingLike = await this.likeService.findByIds(
      targetId,
      currentProfileId,
      targetType,
    );

    if (existingLike) {
      throw new BadRequestException('Нельзя поставить два лайка');
    }

    const handler = this.handlers[targetType];

    if (!handler) {
      throw new BadRequestException('Этому объекту поставить лайк нельзя');
    }

    const target = await handler(targetId);

    const like = await this.likeService.create(
      targetId,
      currentProfileId,
      targetType,
    );

    this.emitEvent(target, currentProfileId);

    return like;
  }

  private emitEvent(target: LikeTargetResult, actorId: number) {
    switch (target.entityType) {
      case LikeTargetType.POST:
        this.eventEmitter.emit(
          PostEvents.POST_LIKED,
          new PostLikeEvent({
            actorId,

            postId: target.entityId,
            postAuthorId: target.receiverId,

            textPreview: target.textPreview,
          }),
        );

        break;

      case LikeTargetType.COMMENT:
        this.eventEmitter.emit(
          CommentEvents.COMMENT_LIKED,
          new CommentLikeEvent({
            actorId,

            commentId: target.entityId,
            commentAuthorId: target.receiverId,

            textPreview: target.textPreview,
          }),
        );

        break;
    }
  }

  private stripHtml(html?: string | null): string {
    if (!html) return '';

    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
