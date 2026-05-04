import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostCommentsService } from '../services/post-comments.service';
import { PostService } from '@app/modules/post/services/post.service';
import EventEmitter2 from 'eventemitter2';
import { CommentEvents } from '@app/shared/events/domain-events';
import { CommentCreateEvent } from '../events/comment-create.event';
import { CommentTargetType } from '../types/comments.interface';

@Injectable()
export class CreateCommentUseCase {
  constructor(
    private readonly commentService: PostCommentsService,
    private readonly postService: PostService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(commentPayload: {
    body: string;
    profileId: number;
    postId: number;
    replyPayload?: {
      parentId: number;
      replyOnId: number;
    };
  }) {
    const { body, postId, profileId, replyPayload } = commentPayload;

    const normalizedBody = body.trim();

    if (!normalizedBody) {
      throw new BadRequestException('Комментарий не может быть пустым!');
    }

    const existingPost = await this.postService.findById(postId);

    if (!existingPost) throw new NotFoundException('Пост не найден');
    if (!existingPost.allowComments) {
      throw new ForbiddenException(
        'Автор поста ограничил доступ к комментариям',
      );
    }

    let resolvedParentId: number | null = null;
    let replyOnId: number | null = null;
    let replyOnUsername: string | null = null;

    if (replyPayload) {
      const replyTarget = await this.commentService.findById(
        replyPayload.replyOnId,
        postId,
      );

      if (!replyTarget) {
        throw new NotFoundException('Комментарий для ответа не найден');
      }

      if (replyTarget.deletedAt) {
        throw new BadRequestException(
          'Нельзя ответить на удалённый комментарий',
        );
      }

      const expectedParentId = replyTarget.parentId ?? replyTarget.id;

      if (replyPayload.parentId !== expectedParentId) {
        throw new BadRequestException('parentId не соответствует replyOnId');
      }

      resolvedParentId = expectedParentId;
      replyOnId = replyTarget.id;
      replyOnUsername = replyTarget.profile.username ?? null;
    }

    const newComment = await this.commentService.create(
      normalizedBody,
      profileId,
      postId,
      resolvedParentId,
      replyOnId,
      replyOnUsername,
    );

    const isRoot = resolvedParentId === null;

    if (isRoot) {
      this.eventEmitter.emit(
        CommentEvents.COMMENT_CREATED,
        new CommentCreateEvent(postId, CommentTargetType.POST),
      );
    } else if (resolvedParentId) {
      this.eventEmitter.emit(
        CommentEvents.COMMENT_CREATED,
        new CommentCreateEvent(resolvedParentId, CommentTargetType.COMMENT),
      );
    }

    return newComment;
  }
}
