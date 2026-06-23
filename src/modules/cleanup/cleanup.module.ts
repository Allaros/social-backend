import { Module } from '@nestjs/common';
import { UserCleanupService } from './services/user-cleanup.service';
import { NotificationsCleanupService } from './services/notification-cleanup.service';
import { LikeCleanupService } from './services/like-cleanup.service';
import { ChatsCleanupService } from './services/chats-cleanup.service';
import { FinishedJobsCleanupService } from './services/finished-job-cleanup.service';

@Module({
  providers: [
    UserCleanupService,
    NotificationsCleanupService,
    LikeCleanupService,
    ChatsCleanupService,
    FinishedJobsCleanupService,
  ],
})
export class CleanupModule {}
