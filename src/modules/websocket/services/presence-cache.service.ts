import { Injectable } from '@nestjs/common';
import { RedisService } from '@app/modules/redis/redis.service';

@Injectable()
export class PresenceCacheService {
  private readonly CONNECTIONS_PREFIX = 'presence:connections';

  constructor(private readonly redisService: RedisService) {}

  private get redis() {
    return this.redisService.getClient();
  }

  private getKey(profileId: number) {
    return `${this.CONNECTIONS_PREFIX}:${profileId}`;
  }

  async incrementConnections(profileId: number) {
    const key = this.getKey(profileId);

    const count = await this.redis.incr(key);

    await this.redis.expire(key, 60 * 60);

    return count;
  }

  async decrementConnections(profileId: number) {
    const key = this.getKey(profileId);

    const exists = await this.redis.exists(key);

    if (!exists) {
      return 0;
    }

    const count = await this.redis.decr(key);

    if (count <= 0) {
      await this.redis.del(key);

      return 0;
    }

    return count;
  }

  async getConnectionsCount(profileId: number) {
    const value = await this.redis.get(this.getKey(profileId));

    return Number(value ?? 0);
  }

  async isOnline(profileId: number) {
    return (await this.getConnectionsCount(profileId)) > 0;
  }

  async getOnlineStatuses(profileIds: number[]) {
    const map = new Map<number, boolean>();

    if (!profileIds.length) {
      return map;
    }

    const pipeline = this.redis.pipeline();

    for (const profileId of profileIds) {
      pipeline.get(this.getKey(profileId));
    }

    const results = await pipeline.exec();

    profileIds.forEach((profileId, index) => {
      const value = Number(results?.[index]?.[1] ?? 0);

      map.set(profileId, value > 0);
    });

    return map;
  }

  async clearPresenceState() {
    const keys = await this.redis.keys(`${this.CONNECTIONS_PREFIX}:*`);

    if (!keys.length) {
      return;
    }

    await this.redis.del(...keys);
  }
}
