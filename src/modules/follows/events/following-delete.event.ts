export class FollowingDeleteEvent {
  constructor(
    public readonly followerId: number,
    public readonly followingId: number,
  ) {}
}
