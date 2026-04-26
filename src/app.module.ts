import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { CleanupService } from './cleanup.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppDataSource } from './data-source';
import { SearchModule } from './modules/search/search.module';
import { PostModule } from './modules/post/post.module';
import { FeedModule } from './modules/feed/feed.module';
import { PostCounterModule } from './modules/post-counters/post-counter.module';
import { LikeModule } from './modules/like/like.module';
import { PostSavingModule } from './modules/post-saving/post-saving.module';
import { PostCommentsModule } from './modules/post-comments/post-comments.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 20,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      autoLoadEntities: true,
    }),
    AuthModule,
    SearchModule,
    PostModule,
    PostCounterModule,
    LikeModule,
    PostSavingModule,
    FeedModule,
    PostCommentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CleanupService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
