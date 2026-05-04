import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateFollowDto } from '../types/follows.dto';
import { CreateFollowingUseCase } from '../use-cases/create-following.usecase';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { UserEntity } from '@app/modules/user/user.entity';
import { RemoveFollowingUseCase } from '../use-cases/remove-following.usecase';

@Controller('follows')
export class FollowsController {
  constructor(
    private readonly createFollowingUseCase: CreateFollowingUseCase,
    private readonly removeFollowingUseCase: RemoveFollowingUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @UsePipes(new ValidationPipe())
  async createFollow(
    @Body() dto: CreateFollowDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.createFollowingUseCase.execute({
      followerId: user.profile.id,
      followingId: dto.followingId,
    });
  }

  @Delete(':followingId')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @UsePipes(new ValidationPipe())
  async removeFollow(
    @Param('followingId', ParseIntPipe) followingId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.removeFollowingUseCase.execute({
      followerId: user.profile.id,
      followingId: followingId,
    });
  }
}
