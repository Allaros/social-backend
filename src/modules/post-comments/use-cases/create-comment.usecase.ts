import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PostCommentsService } from '../services/post-comments.service';
import { PostCounterService } from '@app/modules/post-counters/post-counter.service';
import { PostService } from '@app/modules/post/services/post.service';
import { CommentsCountersService } from '@app/modules/comments-counters/comments-counters.service';

@Injectable()
export class CreateCommentUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly commentService: PostCommentsService,
    private readonly postCounterService: PostCounterService,
    private readonly postService: PostService,
    private readonly commentCounterService: CommentsCountersService,
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

    return await this.dataSource.transaction(async (manager) => {
      let resolvedParentId: number | null = null;
      let replyOnId: number | null = null;
      let replyOnUsername: string | null = null;

      if (replyPayload) {
        const replyTarget = await this.commentService.findById(
          replyPayload.replyOnId,
          postId,
          manager,
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
        manager,
      );

      const isRoot = resolvedParentId === null;

      if (isRoot) {
        await this.postCounterService.updateCounters(
          postId,
          { commentsCount: 1 },
          manager,
        );
      } else if (resolvedParentId) {
        await this.commentCounterService.updateCounters(
          resolvedParentId,
          { repliesCount: 1 },
          manager,
        );
      }

      return newComment;
    });
  }
}
