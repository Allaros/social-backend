import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikeEntity } from './entities/like.entity';
import { LikeController } from './controllers/like.controller';
import { LikeService } from './services/like.service';
import { CreateLikeUseCase } from './use-cases/create-like.usecase';
import { DeleteLikeUseCase } from './use-cases/delete-like.usecase';
import { PostLikeCleanupListener } from './listeners/like-cleanup.listener';
import { PostModule } from '../post/post.module';
import { PostCommentsModule } from '../post-comments/post-comments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LikeEntity]),
    PostModule,
    PostCommentsModule,
  ],
  controllers: [LikeController],
  providers: [
    LikeService,
    CreateLikeUseCase,
    DeleteLikeUseCase,
    PostLikeCleanupListener,
  ],
})
export class LikeModule {}
