import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetFeedUseCase } from '../use-cases/get-feed.usecase';
import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import { GetProfilePostsUseCase } from '../use-cases/get-profile-posts.usecase';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { UserEntity } from '@app/modules/user/user.entity';
import { GetSavedPostsUseCase } from '../use-cases/get-saved-posts.usecase';
import { PaginationDto } from '../types/feed.dto';

@Controller('feed')
export class FeedController {
  constructor(
    private readonly getFeedUseCase: GetFeedUseCase,
    private readonly getProfilePostsUseCase: GetProfilePostsUseCase,
    private readonly getSavedPostsUseCase: GetSavedPostsUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getFeed(
    @CurrentUser() user: UserEntity,
    @Query() query: PaginationDto,
  ) {
    return await this.getFeedUseCase.execute(
      user.profile.id,
      query.limit,
      query.cursor,
    );
  }

  @Get('profile/:id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getMyPosts(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) targetProfileId: number,
    @Query() query: PaginationDto,
  ) {
    console.log(user, targetProfileId, query);
    return await this.getProfilePostsUseCase.execute(
      user.profile.id,
      targetProfileId,
      query.limit,
      query.cursor,
    );
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getSavedPosts(
    @CurrentUser() user: UserEntity,
    @Query() query: PaginationDto,
  ) {
    return await this.getSavedPostsUseCase.execute(
      user.profile.id,
      query.limit,
      query.cursor,
    );
  }
}
