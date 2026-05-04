export class PostCreatedEvent {
  constructor(
    public readonly postId: number,
    public readonly profileId: number,
  ) {}
}
