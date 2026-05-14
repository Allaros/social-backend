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
import { DeleteNotificationByEventUseCase } from './use-cases/delete-notification-by-event.usecase';
import { DeleteNotificationByUserUseCase } from './use-cases/delete-notification-by-user.usecase';
import { NotificationDeleteListener } from './listeners/notification-delete.listener';
import { SetNotificationsSeenUseCase } from './use-cases/set-notifications-seen.usecase';
import { NotificationRealtimeListener } from './listeners/notification-realtime.listener';
import { GetCountersUseCase } from './use-cases/get-counters.usecase';
import { PresenceModule } from '../presence/presence.module';
import { UserModule } from '../user/user.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    ProfileModule,
    PresenceModule,
    UserModule,
    WebsocketModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationCreateListener,
    CreateNotificationUseCase,
    GetNotificationsUseCase,
    NotificationResponseBuilder,
    NotificationService,
    NotificationQueryService,
    DeleteNotificationByEventUseCase,
    DeleteNotificationByUserUseCase,
    NotificationDeleteListener,
    SetNotificationsSeenUseCase,
    NotificationRealtimeListener,
    GetCountersUseCase,
  ],
})
export class NotificationModule {}
