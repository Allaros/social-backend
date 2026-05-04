export class PostHardDeleteEvent {
  constructor(
    public readonly postId: number,
    public readonly profileId: number,
  ) {}
}
