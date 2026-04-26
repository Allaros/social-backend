/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CommentEntity } from '../entities/comment.entity';
import { CommentResponse } from '../types/comments.interface';

export function buildCommentResponse(
  comments: CommentEntity[],
  rawMap: Map<number, any>,
): CommentResponse[] {
  return comments.map((comment) => {
    const raw = rawMap.get(comment.id);

    const isDeleted = !!comment.deletedAt;

    return {
      id: comment.id,
      content: isDeleted ? null : comment.content,
      createdAt: comment.createdAt,
      likesCount: comment.likesCount,
      repliesCount: comment.repliesCount,
      parentId: comment.parentId,
      replyOnId: comment.replyOnId,
      replyOnUsername: comment.replyOnUsername,
      postId: comment.postId,
      isDeleted,
      isLiked: raw?.isLiked ?? false,
      isEdited: comment.isEdited,

      author: {
        id: comment.profile.id,
        username: comment.profile.username,
        name: comment.profile.name,
        avatarUrl: comment.profile.avatarUrl,
      },
    };
  });
}
