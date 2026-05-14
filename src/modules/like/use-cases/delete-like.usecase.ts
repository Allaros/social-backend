import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LikeService } from '../services/like.service';
import { LikeTargetResult, LikeTargetType } from '../types/like.interface';
import EventEmitter2 from 'eventemitter2';
import { CommentEvents, PostEvents } from '@app/shared/events/domain-events';
import { PostUnlikeEvent } from '../events/post-unlike.event';
import { CommentUnlikeEvent } from '../events/comment-unlike.event';
import { PostService } from '@app/modules/post/services/post.service';
import { PostCommentsService } from '@app/modules/post-comments/services/post-comments.service';

@Injectable()
export class DeleteLikeUseCase {
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

      return {
        entityId: post.id,
        entityType: LikeTargetType.POST,
        receiverId: post.profileId,
      };
    },

    [LikeTargetType.COMMENT]: async (targetId) => {
      const comment = await this.commentService.findById(targetId);

      if (!comment) {
        throw new NotFoundException(
          'Комментарий не найден. Возможно, он был удален.',
        );
      }

      return {
        entityId: comment.id,
        entityType: LikeTargetType.COMMENT,
        receiverId: comment.profileId,
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

    if (!existingLike) throw new NotFoundException('Не удалось найти лайк');

    const handler = this.handlers[targetType];

    if (!handler) {
      throw new BadRequestException('Этому объекту поставить лайк нельзя');
    }

    const result = await handler(targetId);

    await this.likeService.delete(targetId, targetType, currentProfileId);

    this.emitEvent(result, currentProfileId);

    return { success: true };
  }

  private emitEvent(result: LikeTargetResult, actorId: number) {
    switch (result.entityType) {
      case LikeTargetType.POST:
        this.eventEmitter.emit(
          PostEvents.POST_UNLIKED,
          new PostUnlikeEvent({
            actorId,
            postId: result.entityId,
            postAuthorId: result.receiverId,
          }),
        );
        break;

      case LikeTargetType.COMMENT:
        this.eventEmitter.emit(
          CommentEvents.COMMENT_UNLIKED,
          new CommentUnlikeEvent({
            actorId,
            commentId: result.entityId,
            commentAuthorId: result.receiverId,
          }),
        );
        break;
    }
  }
}
