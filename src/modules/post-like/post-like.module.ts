import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikesEntity } from './entities/like.entity';
import { PostLikeController } from './controllers/post-like.controller';
import { PostLikeService } from './services/post-like.service';
import { PostLikeUseCase } from './use-cases/post-like.usecase';
import { PostUnlikeUseCase } from './use-cases/post-unlike.usecase';
import { PostCounterModule } from '../post-counters/post-counter.module';

@Module({
  imports: [TypeOrmModule.forFeature([LikesEntity]), PostCounterModule],
  controllers: [PostLikeController],
  providers: [PostLikeService, PostLikeUseCase, PostUnlikeUseCase],
})
export class PostLikeModule {}
