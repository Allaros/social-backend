import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../post/entities/post.entity';
import { PostCounterService } from './post-counter.service';
import { ViewsSyncService } from './views-sync.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity]), RedisModule],
  providers: [PostCounterService, ViewsSyncService],
  exports: [PostCounterService],
})
export class PostCounterModule {}
