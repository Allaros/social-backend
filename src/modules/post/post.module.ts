import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './services/post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { LikesEntity } from './entities/like.entity';
import { CommentEntity } from './entities/comment.entity';
import { PostRepostEntity } from './entities/repost.entity';
import { PostMediaService } from './services/postMedia.service';
import { FileModule } from '../file/file.module';
import { PostMediaEntity } from './entities/media.entity';
import { SavedPostEntity } from './entities/saved_posts';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      LikesEntity,
      CommentEntity,
      PostRepostEntity,
      PostMediaEntity,
      SavedPostEntity,
    ]),
    FileModule,
  ],
  controllers: [PostController],
  providers: [PostService, PostMediaService],
})
export class PostModule {}
