import { CommentTargetType } from '../types/comments.interface';

export class CommentHardDeleteEvent {
  constructor(
    public readonly commentId: number,
    public readonly parentId: number,
    public readonly targetType: CommentTargetType,
  ) {}
}
