import { RedisService } from '@app/modules/redis/redis.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AddViewUseCase {
  constructor(private readonly redisService: RedisService) {}

  async execute(
    postId: number,
    profileId?: number,
    ip?: string,
  ): Promise<boolean> {
    const redis = this.redisService.getClient();

    const viewer = profileId ? `user:${profileId}` : `ip:${ip}`;
    const uniqueKey = `post:view:${postId}:${viewer}`;
    const counterKey = `post:views:${postId}`;

    const exists = await redis.get(uniqueKey);

    if (exists) return false;

    await redis.set(uniqueKey, '1', 'EX', 60 * 60 * 6);

    await redis.incr(counterKey);

    return true;
  }
}
