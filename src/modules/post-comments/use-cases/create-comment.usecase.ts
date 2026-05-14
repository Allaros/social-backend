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
    let replyUserId: number | null = null;
    let textPreview: string | undefined =
      this.stripHtml(existingPost.content) ?? 'Пост без текста';

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
      replyUserId = replyTarget.profileId;
      textPreview = replyTarget.content.trim().slice(0, 20);
    }

    const newComment = await this.commentService.create(
      normalizedBody,
      profileId,
      postId,
      resolvedParentId,
      replyOnId,
      replyOnUsername,
    );

    this.eventEmitter.emit(
      CommentEvents.COMMENT_CREATED,
      new CommentCreateEvent({
        authorId: profileId,
        commentId: newComment.id,
        parentId: resolvedParentId,
        postAuthorId: existingPost.profileId,
        postId,
        replyToUserId: replyUserId,
        textPreview: textPreview,
      }),
    );

    return newComment;
  }

  private stripHtml(html?: string | null): string {
    if (!html) return '';

    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
