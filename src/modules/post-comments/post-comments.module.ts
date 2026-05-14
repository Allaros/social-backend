import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './entities/comment.entity';
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
import { CommentCountersUdateListener } from './listeners/comment-counters-update.listener';
import { CommentNotificationsListener } from './listeners/comment-notifications.listener';

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity]), PostModule],
  controllers: [PostCommentsController, GetPostCommentsController],
  providers: [
    PostCommentsService,
    PostCommentQueryService,
    CreateCommentUseCase,
    DeleteCommentUseCase,
    EditCommentUseCase,
    GetCommentUseCase,
    GetRepliesByParentUseCase,
    CommentCountersUdateListener,
    CommentNotificationsListener,
  ],
  exports: [PostCommentsService],
})
export class PostCommentsModule {}
