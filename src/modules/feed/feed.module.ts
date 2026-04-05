import { Module } from '@nestjs/common';
import { FeedController } from './controllers/feed.controller';
import { FeedService } from './services/feed.service';
import { GetFeedUseCase } from './use-cases/get-feed.usecase';
import { GetSavedPostsUseCase } from './use-cases/get-saved-posts.usecase';
import { GetProfilePostsUseCase } from './use-cases/get-profile-posts.usecase';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../post/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity])],
  controllers: [FeedController],
  providers: [
    FeedService,
    GetFeedUseCase,
    GetSavedPostsUseCase,
    GetProfilePostsUseCase,
  ],
})
export class FeedModule {}
