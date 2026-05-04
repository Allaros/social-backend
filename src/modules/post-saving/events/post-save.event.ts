export class PostSaveEvent {
  constructor(
    public readonly postId: number,
    public readonly profileId: number,
  ) {}
}
