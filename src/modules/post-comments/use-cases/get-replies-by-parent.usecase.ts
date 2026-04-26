import { Injectable } from '@nestjs/common';
import { PostCommentQueryService } from '../services/post-comment-query.service';
import { CursorCodec } from '@app/shared/cursor/codec/cursor-codec';
import { PaginationExecutor } from '@app/shared/cursor/helpers/pagination-executor';
import { buildCommentResponse } from '../builders/comment-response.builder';
import { normalizeCommentRaw } from '../mappers/raw.mapper';
import { ReplyCursor } from '../types/comments.interface';

@Injectable()
export class GetRepliesByParentUseCase {
  private readonly cursorCodec = new CursorCodec<ReplyCursor>([
    'createdAt',
    'id',
  ]);

  constructor(private readonly commentQueryService: PostCommentQueryService) {}

  async execute(payload: {
    parentId: number;
    profileId: number;
    cursor?: string | null;
    limit?: number;
  }) {
    const { parentId, profileId } = payload;

    const limit = Math.min(payload.limit ?? 5, 30);

    const decodedCursor = payload.cursor
      ? this.cursorCodec.decode(payload.cursor)
      : null;

    const cursorInternal = decodedCursor
      ? {
          ...decodedCursor,
          createdAt: new Date(decodedCursor.createdAt),
        }
      : null;

    const qb = this.commentQueryService.getRepliesByParentQuery({
      parentId,
      profileId,
      cursor: cursorInternal,
    });

    const result = await PaginationExecutor.paginate(
      qb,
      limit,
      {
        fields: ['createdAt', 'id'],
        order: 'ASC',
      },
      (comment) => ({
        createdAt: comment.createdAt.getTime(),
        id: comment.id,
      }),
      this.cursorCodec,
    );

    const { data, raw, nextCursor } = result;

    const rawMap = normalizeCommentRaw(raw);
    const comments = buildCommentResponse(data, rawMap);

    return {
      data: comments,
      nextCursor,
    };
  }
}
