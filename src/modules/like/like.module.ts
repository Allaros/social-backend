import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikeEntity } from './entities/like.entity';
import { LikeController } from './controllers/like.controller';
import { LikeService } from './services/like.service';
import { CreateLikeUseCase } from './use-cases/create-like.usecase';
import { DeleteLikeUseCase } from './use-cases/delete-like.usecase';
import { PostCounterModule } from '../post-counters/post-counter.module';
import { CommentsCountersModule } from '../comments-counters/comments-counters.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LikeEntity]),
    PostCounterModule,
    CommentsCountersModule,
  ],
  controllers: [LikeController],
  providers: [LikeService, CreateLikeUseCase, DeleteLikeUseCase],
  exports: [LikeService],
})
export class LikeModule {}
