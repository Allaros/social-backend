import { Injectable } from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { FollowingEvents, PostEvents } from '@app/shared/events/domain-events';
import { FollowingCreateEvent } from '@app/modules/follows/events/following-create.event';
import { OnEvent } from '@nestjs/event-emitter';
import { PostCreatedEvent } from '@app/modules/post/events/post-create.event';
import { PostHardDeleteEvent } from '@app/modules/post/events/post-hard-delete.event';

@Injectable()
export class ProfileCounterUpdateListener {
  constructor(private readonly profileService: ProfileService) {}

  @OnEvent(FollowingEvents.FOLLOWING_CREATED)
  async incrementFollowings(event: FollowingCreateEvent) {
    await this.profileService.updateCounters(event.followerId, {
      followingCount: 1,
    });

    await this.profileService.updateCounters(event.followingId, {
      followersCount: 1,
    });
  }

  @OnEvent(FollowingEvents.FOLLOWING_DELETED)
  async decrementFollowings(event: FollowingCreateEvent) {
    await this.profileService.updateCounters(event.followerId, {
      followingCount: -1,
    });

    await this.profileService.updateCounters(event.followingId, {
      followersCount: -1,
    });
  }

  @OnEvent(PostEvents.POST_CREATED)
  async incrementPostsCount(event: PostCreatedEvent) {
    await this.profileService.updateCounters(event.profileId, {
      postsCount: 1,
    });
  }

  @OnEvent(PostEvents.POST_HARD_DELETE)
  async decrementPostsCount(event: PostHardDeleteEvent) {
    await this.profileService.updateCounters(event.profileId, {
      postsCount: -1,
    });
  }
}
