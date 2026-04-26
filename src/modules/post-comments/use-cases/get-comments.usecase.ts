import { Injectable } from '@nestjs/common';
import { PostCommentQueryService } from '../services/post-comment-query.service';
import { CommentCursor, CommentResponse } from '../types/comments.interface';
import { CursorCodec } from '@app/shared/cursor/codec/cursor-codec';
import { PaginationExecutor } from '@app/shared/cursor/helpers/pagination-executor';
import { normalizeCommentRaw } from '../mappers/raw.mapper';
import { buildCommentResponse } from '../builders/comment-response.builder';

@Injectable()
export class GetCommentUseCase {
  private readonly cursorCodec = new CursorCodec<CommentCursor>([
    'likesCount',
    'createdAt',
    'id',
  ]);

  constructor(private readonly commentQueryService: PostCommentQueryService) {}

  async execute(payload: {
    postId: number;
    profileId: number;
    cursor?: string | null;
    limit?: number;
  }) {
    const { postId, profileId } = payload;

    const limit = Math.min(payload.limit ?? 5, 10);

    const decodedCursor = payload.cursor
      ? this.cursorCodec.decode(payload.cursor)
      : null;

    const cursorInternal = decodedCursor
      ? {
          ...decodedCursor,
          createdAt: new Date(decodedCursor.createdAt),
        }
      : null;

    const qb = this.commentQueryService.getDataQuery({
      postId,
      profileId,
      cursor: cursorInternal,
    });

    const result = await PaginationExecutor.paginate(
      qb,
      limit,
      {
        fields: ['likesCount', 'createdAt', 'id'],
        order: 'DESC',
      },
      (comment) => ({
        likesCount: comment.likesCount,
        createdAt: comment.createdAt.getTime(),
        id: comment.id,
      }),
      this.cursorCodec,
    );

    const { data, nextCursor, raw } = result;

    const rawMap = normalizeCommentRaw(raw);

    const comments = buildCommentResponse(data, rawMap);

    const rootIds = comments.map((c) => c.id);

    const replies = await this.getReplies({
      parentIds: rootIds,
      profileId,
      limitPerParent: 3,
    });

    return {
      data: comments,
      nextCursor,
      replies,
    };
  }

  async getReplies(payload: {
    parentIds: number[];
    profileId: number;
    limitPerParent?: number;
  }) {
    const { parentIds, profileId, limitPerParent } = payload;

    const result = await this.commentQueryService
      .getRepliesQuery({
        parentIds,
        profileId,
        limitPerParent,
      })
      .getRawAndEntities();

    const rawMap = normalizeCommentRaw(result.raw);
    const comments = buildCommentResponse(result.entities, rawMap);

    return this.groupByParent(comments);
  }

  private groupByParent(comments: CommentResponse[]) {
    const map: Record<number, CommentResponse[]> = {};

    for (const comment of comments) {
      if (comment.parentId == null) continue;

      if (!map[comment.parentId]) {
        map[comment.parentId] = [];
      }

      map[comment.parentId].push(comment);
    }

    return map;
  }
}
