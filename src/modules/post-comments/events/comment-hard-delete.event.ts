type DeleteCommentProps = {
  commentId: number;
  postId: number;

  authorId: number;

  parentId: number | null;
  replyToUserId: number | null;

  postAuthorId: number;
};

export class CommentHardDeleteEvent {
  public readonly commentId: number;
  public readonly postId: number;

  public readonly authorId: number;

  public readonly parentId: number | null;
  public readonly replyToUserId: number | null;

  public readonly postAuthorId: number;
  constructor(props: DeleteCommentProps) {
    Object.assign(this, props);
  }
}
