import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class DeleteNotificationByUserUseCase {
  constructor(private readonly notificationService: NotificationService) {}

  async execute(notificationId: number, profileId: number) {
    const existingNotification =
      await this.notificationService.findById(notificationId);

    if (!existingNotification)
      throw new NotFoundException(
        'Не удается найти уведомление. Возможно оно уже было удалено',
      );

    if (existingNotification.receiverId !== profileId)
      throw new ForbiddenException('Вы не можете удалить чужое уведомление');

    await this.notificationService.delete(notificationId);

    return { success: true };
  }
}
