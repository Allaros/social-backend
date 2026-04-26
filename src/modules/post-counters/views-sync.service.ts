import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '@app/modules/redis/redis.service';
import { PostCounterService } from '@app/modules/post-counters/post-counter.service';

@Injectable()
export class ViewsSyncService {
  constructor(
    private readonly redisService: RedisService,
    private readonly postCounterService: PostCounterService,
  ) {}

  @Cron('*/30 * * * * *')
  async syncViews() {
    const redis = this.redisService.getClient();

    let cursor = '0';

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        'post:views:*',
        'COUNT',
        100,
      );

      cursor = nextCursor;

      for (const key of keys) {
        const postId = Number(key.split(':')[2]);

        const viewsRaw = await redis.getdel(key);
        const views = Number(viewsRaw);

        if (!views) continue;

        await this.postCounterService.updateCounters(postId, {
          viewsCount: views,
        });
      }
    } while (cursor !== '0');
  }
}
