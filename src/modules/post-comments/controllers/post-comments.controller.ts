import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import { UserEntity } from '@app/modules/user/user.entity';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  CreateCommentDto,
  EditCommentDto,
  GetCommentsQueryDto,
} from '../types/comments.dto';
import { CreateCommentUseCase } from '../use-cases/create-comment.usecase';
import { EditCommentUseCase } from '../use-cases/edit-comment.usecase';
import { DeleteCommentUseCase } from '../use-cases/delete-comment.usecase';
import { GetRepliesByParentUseCase } from '../use-cases/get-replies-by-parent.usecase';

@Controller('comments')
export class PostCommentsController {
  constructor(
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly editCommentUseCase: EditCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly getRepliesByParentUseCase: GetRepliesByParentUseCase,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe())
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async createComment(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateCommentDto,
  ) {
    const replyPayload =
      dto.parentId != null && dto.replyOnId != null
        ? {
            parentId: dto.parentId,
            replyOnId: dto.replyOnId,
          }
        : undefined;

    const comment = await this.createCommentUseCase.execute({
      body: dto.body,
      postId: dto.postId,
      profileId: user.profile.id,
      replyPayload,
    });

    return comment;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async editComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Body() dto: EditCommentDto,
    @CurrentUser() user: UserEntity,
  ) {
    return await this.editCommentUseCase.execute({
      body: dto.body,
      commentId,
      postId: dto.postId,
      profileId: user.profile.id,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async deleteComment(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) commentId: number,
  ) {
    return await this.deleteCommentUseCase.execute(user.profile.id, commentId);
  }

  @Get(':parentId/replies')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getReplies(
    @Param('parentId', ParseIntPipe) parentId: number,
    @CurrentUser() user: UserEntity,
    @Query() query: GetCommentsQueryDto,
  ) {
    return await this.getRepliesByParentUseCase.execute({
      parentId,
      profileId: user.profile.id,
      cursor: query.cursor ?? null,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }
}
