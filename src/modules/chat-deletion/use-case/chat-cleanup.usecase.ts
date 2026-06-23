import { Injectable } from '@nestjs/common';
import { ChatDeletionService } from '../services/chat-deletion.service';
import { ChatService } from '@app/modules/chat/services/chat.service';
import { MessagesService } from '@app/modules/messages/services/messages.service';
import { CleanupMessagesUseCase } from '@app/modules/messages/use-cases/cleanup-messages.usecase';
import { ChatDeletionJobStatus } from '../entities/chat-deletion.entity';

@Injectable()
export class ChatCleanupUseCase {
  constructor(
    private readonly chatDeletionService: ChatDeletionService,
    private readonly chatService: ChatService,
    private readonly messagesService: MessagesService,
    private readonly cleanupMessagesUseCase: CleanupMessagesUseCase,
  ) {}

  async execute() {
    const jobs = await this.chatDeletionService.getActiveJobs(5);

    for (const job of jobs) {
      try {
        if (job.status === ChatDeletionJobStatus.PENDING)
          await this.chatDeletionService.markProcessing(job.id);

        const messageIds = await this.messagesService.getBatchIdsForDeletion(
          job.chatId,
          500,
        );

        console.log(
          `Chat ${job.chatId}: found ${messageIds.length} messages for deletion`,
        );

        if (!messageIds.length) {
          await this.chatService.hardDelete(job.chatId);

          await this.chatDeletionService.markDone(job.id);

          continue;
        }

        await this.cleanupMessagesUseCase.execute({
          chatId: job.chatId,
          messageIds,
        });
      } catch (err) {
        await this.chatDeletionService.markFailed(job.id);
        console.log(err);
      }
    }
  }
}
