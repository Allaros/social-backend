import { RedisService } from '@app/modules/redis/redis.service';
import { PresenceEvents } from '@app/shared/events/domain-events';
import { Injectable } from '@nestjs/common';
import EventEmitter2 from 'eventemitter2';
import { UserOfflineEvent } from '../events/user-offline.event';
import { UserOnlineEvent } from '../events/user-online.event';

@Injectable()
export class PresenceService {
  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async connect(profileId: number, socketId: string) {
    const redis = this.redisService.getClient();

    const key = `presence:user:${profileId}:sockets`;

    await redis.sadd(key, socketId);

    const totalConnections = await redis.scard(key);

    if (totalConnections === 1) {
      this.eventEmitter.emit(
        PresenceEvents.USER_ONLINE,
        new UserOnlineEvent(profileId),
      );
    }
  }

  async disconnect(profileId: number, socketId: string) {
    const redis = this.redisService.getClient();

    const key = `presence:user:${profileId}:sockets`;

    await redis.srem(key, socketId);

    const connections = await redis.scard(key);

    if (connections === 0) {
      this.eventEmitter.emit(
        PresenceEvents.USER_OFFLINE,
        new UserOfflineEvent(profileId),
      );
    }
  }

  async isOnline(profileId: number) {
    const redis = this.redisService.getClient();

    return (await redis.scard(`presence:user:${profileId}:sockets`)) > 0;
  }

  async getOnlineStatuses(profileIds: number[]) {
    const map = new Map<number, boolean>();

    for (const profileId of profileIds) {
      map.set(profileId, await this.isOnline(profileId));
    }

    return map;
  }
}
