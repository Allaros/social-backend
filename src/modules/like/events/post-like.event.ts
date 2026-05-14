type PostLikeEventPayload = {
  actorId: number;

  postId: number;
  postAuthorId: number;

  textPreview?: string;
  imagePreview?: string;
};

export class PostLikeEvent {
  public readonly actorId: number;

  public readonly postId: number;
  public readonly postAuthorId: number;

  public readonly textPreview?: string;
  public readonly imagePreview?: string;

  constructor(props: PostLikeEventPayload) {
    Object.assign(this, props);
  }
}
