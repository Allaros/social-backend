import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './entities/comment.entity';
import { PostCounterModule } from '../post-counters/post-counter.module';
import { PostCommentsController } from './controllers/post-comments.controller';
import { PostCommentsService } from './services/post-comments.service';
import { CreateCommentUseCase } from './use-cases/create-comment.usecase';
import { DeleteCommentUseCase } from './use-cases/delete-comment.usecase';
import { EditCommentUseCase } from './use-cases/edit-comment.usecase';
import { PostModule } from '../post/post.module';
import { GetPostCommentsController } from './controllers/get-post-comments.controller';
import { GetCommentUseCase } from './use-cases/get-comments.usecase';
import { GetRepliesByParentUseCase } from './use-cases/get-replies-by-parent.usecase';
import { PostCommentQueryService } from './services/post-comment-query.service';
import { LikeModule } from '../like/like.module';
import { CommentsCountersModule } from '../comments-counters/comments-counters.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentEntity]),
    PostCounterModule,
    PostModule,
    LikeModule,
    CommentsCountersModule,
  ],
  controllers: [PostCommentsController, GetPostCommentsController],
  providers: [
    PostCommentsService,
    PostCommentQueryService,
    CreateCommentUseCase,
    DeleteCommentUseCase,
    EditCommentUseCase,
    GetCommentUseCase,
    GetRepliesByParentUseCase,
  ],
  exports: [PostCommentsService],
})
export class PostCommentsModule {}
