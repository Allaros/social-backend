import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostCommentsService } from '../services/post-comments.service';
import EventEmitter2 from 'eventemitter2';
import { CommentEvents } from '@app/shared/events/domain-events';
import { CommentHardDeleteEvent } from '../events/comment-hard-delete.event';
import { CommentTargetType } from '../types/comments.interface';

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    private readonly commentService: PostCommentsService,
    private readonly eventEmmiter: EventEmitter2,
  ) {}

  async execute(profileId: number, commentId: number) {
    const existingComment = await this.commentService.findById(commentId);

    if (!existingComment) throw new NotFoundException('Комментарий не найден');

    if (existingComment.deletedAt)
      throw new BadRequestException('Комментарий уже удален');

    if (existingComment.profileId !== profileId)
      throw new ForbiddenException('Вы не являетесь автором комментария');

    const postId = existingComment.postId;

    const isRoot = !existingComment.parentId;
    const hasReplies = existingComment.repliesCount > 0;

    if (isRoot) {
      if (hasReplies) {
        await this.commentService.delete(commentId);
      } else {
        await this.commentService.hardDelete(commentId);

        this.eventEmmiter.emit(
          CommentEvents.COMMENT_HARD_DELETE,
          new CommentHardDeleteEvent(commentId, postId, CommentTargetType.POST),
        );
      }

      return { success: true };
    }

    const parentId = existingComment.parentId!;

    await this.commentService.hardDelete(commentId);

    this.eventEmmiter.emit(
      CommentEvents.COMMENT_HARD_DELETE,
      new CommentHardDeleteEvent(
        commentId,
        parentId,
        CommentTargetType.COMMENT,
      ),
    );

    const parent = await this.commentService.findById(parentId, postId);

    if (parent && parent.deletedAt && parent.repliesCount === 0) {
      await this.commentService.hardDelete(parent.id);

      if (!parent.parentId) {
        this.eventEmmiter.emit(
          CommentEvents.COMMENT_HARD_DELETE,
          new CommentHardDeleteEvent(commentId, postId, CommentTargetType.POST),
        );
      }
    }

    return { success: true };
  }
}
