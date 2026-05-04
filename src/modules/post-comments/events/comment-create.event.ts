import { CommentTargetType } from '../types/comments.interface';

export class CommentCreateEvent {
  constructor(
    public readonly targetId: number,
    public readonly targetType: CommentTargetType,
  ) {}
}
