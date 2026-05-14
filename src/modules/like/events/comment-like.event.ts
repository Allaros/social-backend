type CommentLikeEventPayload = {
  actorId: number;

  commentId: number;
  commentAuthorId: number;

  textPreview?: string;
};

export class CommentLikeEvent {
  public readonly actorId: number;

  public readonly commentId: number;
  public readonly commentAuthorId: number;

  public readonly textPreview?: string;

  constructor(props: CommentLikeEventPayload) {
    Object.assign(this, props);
  }
}
