type PostUnlikePayload = {
  actorId: number;
  postAuthorId: number;
  postId: number;
};

export class PostUnlikeEvent {
  public readonly actorId: number;
  public readonly postAuthorId: number;
  public readonly postId: number;
  constructor(props: PostUnlikePayload) {
    Object.assign(this, props);
  }
}
