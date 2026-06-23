import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MessagesContentService } from '../services/messages-content.service';
import { MessagesService } from '../services/messages.service';
import { AttachmentCleanupService } from '../application/attachments-cleanup.service';

@Injectable()
export class CleanupMessagesUseCase {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesContentService: MessagesContentService,
    private readonly dataSource: DataSource,
    private readonly attachmentCleanupService: AttachmentCleanupService,
  ) {}

  async execute({
    chatId,
    messageIds,
  }: {
    chatId: number;
    messageIds: number[];
  }) {
    if (!messageIds.length) {
      return;
    }
    const messages = await this.messagesService.findMany(
      messageIds,
      undefined,
      ['attachments'],
    );

    if (!messages.length) {
      return;
    }

    const contentIds = messages
      .map((message) => message.contentId)
      .filter((id): id is number => id !== null);

    const attachments = messages.flatMap((message) => message.attachments);

    await this.dataSource.transaction(async (manager) => {
      if (contentIds.length) {
        await this.messagesContentService.hardDelete(contentIds, manager);
      }

      await this.messagesService.messagesHardDelete(
        chatId,
        messageIds,
        manager,
      );
    });

    await this.attachmentCleanupService.cleanupAttachments({ attachments });
  }
}
