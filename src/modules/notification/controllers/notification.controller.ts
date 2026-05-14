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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetNotificationsUseCase } from '../use-cases/get-notifications.usecase';
import { DeleteNotificationByUserUseCase } from '../use-cases/delete-notification-by-user.usecase';
import { SetNotificationsSeenUseCase } from '../use-cases/set-notifications-seen.usecase';
import { GetCountersUseCase } from '../use-cases/get-counters.usecase';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly deleteNotificationByUserUseCase: DeleteNotificationByUserUseCase,
    private readonly setNotificationsSeenUseCase: SetNotificationsSeenUseCase,
    private readonly getCountersUseCase: GetCountersUseCase,
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async deleteNotification(
    @Param('id', ParseIntPipe) notificationId: number,
    @CurrentUser() user: UserEntity,
  ) {
    await this.deleteNotificationByUserUseCase.execute(
      notificationId,
      user.profile.id,
    );
  }

  @Put()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async markAsSeen(
    @Body() dto: { notificationIds: number[] },
    @CurrentUser() user: UserEntity,
  ) {
    await this.setNotificationsSeenUseCase.execute(
      dto.notificationIds,
      user.profile.id,
    );
    return { success: true };
  }

  @Get('state')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getNotificationCount(@CurrentUser() user: UserEntity) {
    return await this.getCountersUseCase.execute(user.profile.id);
  }
}
