import { Module } from '@nestjs/common';
import { PostController } from './controllers/post.controller';
import { PostService } from './services/post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { FileModule } from '../file/file.module';
import { PostMediaModule } from '../post-media/post-media.module';
import { CreatePostUseCase } from './use-cases/create-post.usecase';
import { HardDeletePostUseCase } from './use-cases/hard-delete-post.usecase';
import { SoftDeletePostUseCase } from './use-cases/soft-delete-post.usecase';
import { RecoverPostUseCase } from './use-cases/recover-post.usecase';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity]),
    FileModule,
    PostMediaModule,
    ProfileModule,
  ],
  controllers: [PostController],
  providers: [
    PostService,
    CreatePostUseCase,
    HardDeletePostUseCase,
    SoftDeletePostUseCase,
    RecoverPostUseCase,
  ],
  exports: [PostService],
})
export class PostModule {}
