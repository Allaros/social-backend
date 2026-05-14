import { Injectable } from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { OnEvent } from '@nestjs/event-emitter';
import { PresenceEvents } from '@app/shared/events/domain-events';
import { UserOfflineEvent } from '@app/modules/presence/events/user-offline.event';

@Injectable()
export class ProfileStatusListener {
  constructor(private readonly profileService: ProfileService) {}

  @OnEvent(PresenceEvents.USER_OFFLINE)
  async setLastSeen(event: UserOfflineEvent) {
    await this.profileService.updateLastSeen(event.profileId);
  }
}
