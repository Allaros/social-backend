export class FollowingCreateEvent {
  constructor(
    public readonly followerId: number,
    public readonly followingId: number,
  ) {}
}
