import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetCommentUseCase } from '../use-cases/get-comments.usecase';
import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { UserEntity } from '@app/modules/user/user.entity';
import { GetCommentsQueryDto } from '../types/comments.dto';

@Controller()
export class GetPostCommentsController {
  constructor(private readonly getCommentsUseCase: GetCommentUseCase) {}

  @Get('posts/:postId/comments')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getComments(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: UserEntity,
    @Query() query: GetCommentsQueryDto,
  ) {
    return await this.getCommentsUseCase.execute({
      postId,
      profileId: user.profile.id,
      cursor: query.cursor,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }
}
