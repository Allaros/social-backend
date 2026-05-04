import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationCreateListener } from './listeners/notification-create.listener';
import { CreateNotificationUseCase } from './use-cases/create-notification.usecase';
import { GetNotificationsUseCase } from './use-cases/get-notifications.usecase';
import { NotificationResponseBuilder } from './builders/notification-response-builder';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { NotificationQueryService } from './services/notification-query.service';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity]), ProfileModule],
  controllers: [NotificationController],
  providers: [
    NotificationCreateListener,
    CreateNotificationUseCase,
    GetNotificationsUseCase,
    NotificationResponseBuilder,
    NotificationService,
    NotificationQueryService,
  ],
  exports: [],
})
export class NotificationModule {}
