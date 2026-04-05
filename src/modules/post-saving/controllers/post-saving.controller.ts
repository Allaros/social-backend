import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import { UserEntity } from '@app/modules/user/user.entity';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { SavePostUseCase } from '../use-cases/save-post.usecase';
import { UnsavePostUseCase } from '../use-cases/unsave-post.usecase';

@Controller('save')
export class PostSavingController {
  constructor(
    private readonly savePostUseCase: SavePostUseCase,
    private readonly unsavePostUseCase: UnsavePostUseCase,
  ) {}
  @Post(':postId')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async savePost(
    @Param('postId') postId: string,
    @CurrentUser() user: UserEntity,
  ) {
    return await this.savePostUseCase.execute(Number(postId), user.profile.id);
  }

  @Delete(':postId')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async unsavePost(
    @Param('postId') postId: string,
    @CurrentUser() user: UserEntity,
  ) {
    return await this.unsavePostUseCase.execute(
      Number(postId),
      user.profile.id,
    );
  }
}
