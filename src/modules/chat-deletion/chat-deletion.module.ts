import { Module } from '@nestjs/common';
import { ChatDeletionService } from './services/chat-deletion.service';
import { ChatCleanupUseCase } from './use-case/chat-cleanup.usecase';
import { ChatCLeanupScheduler } from './application/chat-cleanup-sceduler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatDeletionJobEntity } from './entities/chat-deletion.entity';
import { MessagesModule } from '../messages/messages.module';
import { ChatModule } from '../chat/chat.module';
import { ChatDeletionListener } from './listeners/chat-deletion.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatDeletionJobEntity]),
    MessagesModule,
    ChatModule,
  ],
  providers: [
    ChatDeletionService,
    ChatCleanupUseCase,
    ChatCLeanupScheduler,
    ChatDeletionListener,
  ],
})
export class ChatDeletionModule {}
