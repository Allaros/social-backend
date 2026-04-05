import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import { UserEntity } from '@app/modules/user/user.entity';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PostLikeUseCase } from '../use-cases/post-like.usecase';
import { PostUnlikeUseCase } from '../use-cases/post-unlike.usecase';

@Controller('like')
export class PostLikeController {
  constructor(
    private readonly postLikeUseCase: PostLikeUseCase,
    private readonly postUnlikeUseCase: PostUnlikeUseCase,
  ) {}

  @Post(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async like(
    @Param('id', ParseIntPipe) postId: number,
    @CurrentUser() user: UserEntity,
  ) {
    const like = await this.postLikeUseCase.execute(postId, user.profile.id);
    return like;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async unlike(
    @Param('id', ParseIntPipe) postId: number,
    @CurrentUser() user: UserEntity,
  ) {
    await this.postUnlikeUseCase.execute(postId, user.profile.id);
  }
}
