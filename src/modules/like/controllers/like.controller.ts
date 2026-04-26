import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import { UserEntity } from '@app/modules/user/user.entity';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import {
  Controller,
  Delete,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateLikeUseCase } from '../use-cases/create-like.usecase';
import { DeleteLikeUseCase } from '../use-cases/delete-like.usecase';
import { LikeTargetType } from '../types/like.interface';

@Controller('likes')
export class LikeController {
  constructor(
    private readonly createLikeUseCase: CreateLikeUseCase,
    private readonly deleteLikeUseCase: DeleteLikeUseCase,
  ) {}

  @Post(':type/:id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async like(
    @Param('id', ParseIntPipe) targetId: number,
    @Param('type', new ParseEnumPipe(LikeTargetType))
    targetType: LikeTargetType,
    @CurrentUser() user: UserEntity,
  ) {
    const like = await this.createLikeUseCase.execute(
      targetId,
      user.profile.id,
      targetType,
    );
    return like;
  }

  @Delete(':type/:id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async unlike(
    @Param('id', ParseIntPipe) targetId: number,
    @Param('type', new ParseEnumPipe(LikeTargetType))
    targetType: LikeTargetType,
    @CurrentUser() user: UserEntity,
  ) {
    await this.deleteLikeUseCase.execute(targetId, user.profile.id, targetType);
  }
}
