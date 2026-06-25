import { Injectable } from '@nestjs/common';
import { PresenceCacheService } from './presence-cache.service';

@Injectable()
export class PresenceStateService {
  constructor(private readonly presenceCacheService: PresenceCacheService) {}

  async isOnline(profileId: number) {
    return this.presenceCacheService.isOnline(profileId);
  }

  async getOnlineStatuses(profileIds: number[]) {
    return this.presenceCacheService.getOnlineStatuses(profileIds);
  }
}
