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
import { PostService } from '@app/modules/post/services/post.service';

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    private readonly commentService: PostCommentsService,
    private readonly postService: PostService,
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

    const post = await this.postService.findById(postId);

    if (!post)
      throw new NotFoundException('Пост не найден. Возможно, он был удален');

    const postAuthorId = post.profileId;

    let replyToUserId: number | null = null;

    const isRoot = !existingComment.parentId;
    const hasReplies = existingComment.repliesCount > 0;

    if (isRoot) {
      if (hasReplies) {
        await this.commentService.delete(commentId);
      } else {
        await this.commentService.hardDelete(commentId);

        this.eventEmmiter.emit(
          CommentEvents.COMMENT_HARD_DELETE,
          new CommentHardDeleteEvent({
            authorId: profileId,
            commentId: commentId,
            parentId: null,
            postAuthorId,
            postId,
            replyToUserId: null,
          }),
        );
      }

      return { success: true };
    }

    const parentId = existingComment.parentId!;

    if (existingComment.replyOnId) {
      const replyTarget = await this.commentService.findById(
        existingComment.replyOnId,
        postId,
      );

      if (replyTarget) {
        replyToUserId = replyTarget.profileId;
      }
    }

    await this.commentService.hardDelete(commentId);

    const parent = await this.commentService.findById(parentId, postId);

    if (!parent)
      throw new NotFoundException(
        'Комментарий не найден. Возможно, он был удален',
      );

    this.eventEmmiter.emit(
      CommentEvents.COMMENT_HARD_DELETE,
      new CommentHardDeleteEvent({
        authorId: profileId,
        commentId: commentId,
        parentId: parentId,
        postAuthorId,
        postId,
        replyToUserId,
      }),
    );

    if (parent.deletedAt && parent.repliesCount === 0) {
      await this.commentService.hardDelete(parent.id);

      if (!parent.parentId) {
        this.eventEmmiter.emit(
          CommentEvents.COMMENT_HARD_DELETE,
          new CommentHardDeleteEvent({
            authorId: profileId,
            commentId: parent.id,
            parentId: null,
            postAuthorId,
            postId,
            replyToUserId: null,
          }),
        );
      }
    }

    return { success: true };
  }
}
