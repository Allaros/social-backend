import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import { UserEntity } from '@app/modules/user/user.entity';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GetNotificationsUseCase } from '../use-cases/get-notifications.usecase';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getNotifications(
    @CurrentUser() user: UserEntity,
    @Query('cursor') cursor: string,
  ) {
    return this.getNotificationsUseCase.execute({
      receiverId: user.profile.id,
      cursor,
    });
  }
}
