import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostCommentsService } from '../services/post-comments.service';
import { DataSource } from 'typeorm';
import { PostCounterService } from '@app/modules/post-counters/post-counter.service';
import { LikeService } from '@app/modules/like/services/like.service';
import { LikeTargetType } from '@app/modules/like/types/like.interface';
import { CommentsCountersService } from '@app/modules/comments-counters/comments-counters.service';

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    private readonly commentService: PostCommentsService,
    private readonly likeService: LikeService,
    private readonly dataSource: DataSource,
    private readonly postCounterService: PostCounterService,
    private readonly commentCounterService: CommentsCountersService,
  ) {}

  async execute(profileId: number, commentId: number) {
    const existingComment = await this.commentService.findById(commentId);

    if (!existingComment) throw new NotFoundException('Комментарий не найден');

    if (existingComment.deletedAt)
      throw new BadRequestException('Комментарий уже удален');

    if (existingComment.profileId !== profileId)
      throw new ForbiddenException('Вы не являетесь автором комментария');

    const postId = existingComment.postId;

    await this.dataSource.transaction(async (manager) => {
      const isRoot = !existingComment.parentId;
      const hasReplies = existingComment.repliesCount > 0;

      if (isRoot) {
        if (hasReplies) {
          await this.commentService.delete(commentId, manager);
        } else {
          await this.likeService.deleteByTarget({
            manager,
            targetId: commentId,
            targetType: LikeTargetType.COMMENT,
          });

          await this.commentService.hardDelete(commentId, manager);

          await this.postCounterService.updateCounters(
            postId,
            { commentsCount: -1 },
            manager,
          );
        }

        return;
      }

      const parentId = existingComment.parentId!;

      await this.likeService.deleteByTarget({
        manager,
        targetId: commentId,
        targetType: LikeTargetType.COMMENT,
      });

      await this.commentService.hardDelete(commentId, manager);

      await this.commentCounterService.updateCounters(
        parentId,
        { repliesCount: -1 },
        manager,
      );

      const parent = await this.commentService.findById(
        parentId,
        postId,
        manager,
      );

      if (parent && parent.deletedAt && parent.repliesCount === 0) {
        await this.commentService.hardDelete(parent.id, manager);

        if (!parent.parentId) {
          await this.postCounterService.updateCounters(
            postId,
            { commentsCount: -1 },
            manager,
          );
        }
      }
    });

    return { success: true };
  }
}
