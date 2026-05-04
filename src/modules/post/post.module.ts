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
import { EditPostUseCase } from './use-cases/edit-post.usecase';
import { RedisModule } from '../redis/redis.module';
import { AddViewUseCase } from './use-cases/add-view.usecase';
import { PostCountUpdatingListener } from './listeners/post-counter-updating.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity]),
    FileModule,
    PostMediaModule,
    ProfileModule,
    RedisModule,
  ],
  controllers: [PostController],
  providers: [
    PostService,
    CreatePostUseCase,
    HardDeletePostUseCase,
    SoftDeletePostUseCase,
    RecoverPostUseCase,
    EditPostUseCase,
    AddViewUseCase,
    PostCountUpdatingListener,
  ],
  exports: [PostService],
})
export class PostModule {}
