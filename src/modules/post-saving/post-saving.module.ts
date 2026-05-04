import { Module } from '@nestjs/common';
import { PostSavingController } from './controllers/post-saving.controller';
import { PostSavingService } from './services/post-saving.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedPostEntity } from './entities/saved_posts.entity';
import { SavePostUseCase } from './use-cases/save-post.usecase';
import { UnsavePostUseCase } from './use-cases/unsave-post.usecase';
import { PostModule } from '../post/post.module';

@Module({
  imports: [TypeOrmModule.forFeature([SavedPostEntity]), PostModule],
  controllers: [PostSavingController],
  providers: [PostSavingService, SavePostUseCase, UnsavePostUseCase],
})
export class PostSavingModule {}
