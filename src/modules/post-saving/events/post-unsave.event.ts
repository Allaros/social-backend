export class PostUnsaveEvent {
  constructor(
    public readonly postId: number,
    public readonly profileId: number,
  ) {}
}
