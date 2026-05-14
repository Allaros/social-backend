type CommentUnlikeProps = {
  actorId: number;
  commentId: number;
  commentAuthorId: number;
};

export class CommentUnlikeEvent {
  public readonly actorId: number;
  public readonly commentId: number;
  public readonly commentAuthorId: number;
  constructor(props: CommentUnlikeProps) {
    Object.assign(this, props);
  }
}
