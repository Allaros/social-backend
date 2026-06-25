import { Injectable, OnModuleInit } from '@nestjs/common';
import { PresenceCacheService } from './presence-cache.service';

@Injectable()
export class PresenceBootstrapService implements OnModuleInit {
  constructor(private readonly presenceCacheService: PresenceCacheService) {}

  async onModuleInit() {
    await this.presenceCacheService.clearPresenceState();

    console.log('[PRESENCE] State cleared');
  }
}
