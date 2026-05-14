type CreateCommentProps = {
  commentId: number;
  postId: number;

  authorId: number;

  parentId: number | null;
  replyToUserId: number | null;

  postAuthorId: number;
  textPreview?: string;
};

export class CommentCreateEvent {
  public readonly commentId: number;
  public readonly postId: number;

  public readonly authorId: number;

  public readonly parentId: number | null;
  public readonly replyToUserId: number | null;
  public readonly textPreview?: string;

  public readonly postAuthorId: number;
  constructor(props: CreateCommentProps) {
    Object.assign(this, props);
  }
}
