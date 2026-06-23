import { StorageService } from '@app/modules/file/services/storage.service';
import { Injectable } from '@nestjs/common';
import { MessagesAttachmentService } from '../services/messages-attachment.service';
import { MessageAttachmentEntity } from '../entities/messages-attachment.entity';

@Injectable()
export class AttachmentCleanupService {
  constructor(
    private readonly storageService: StorageService,
    private readonly messagesAttachmentService: MessagesAttachmentService,
  ) {}

  async cleanupAttachments({
    attachmentIds,
    attachments,
  }: {
    attachmentIds?: number[];
    attachments?: MessageAttachmentEntity[];
  }) {
    if (!attachmentIds?.length && !attachments?.length) {
      return;
    }

    const resolvedAttachments =
      attachments ??
      (attachmentIds?.length
        ? await this.messagesAttachmentService.findManyById(attachmentIds)
        : []);

    if (!resolvedAttachments.length) {
      return;
    }

    const storageKeys = [
      ...new Set(
        resolvedAttachments.map((attachment) => attachment.storageKey),
      ),
    ];

    const usageMap =
      await this.messagesAttachmentService.getStorageKeysUsage(storageKeys);

    const storageKeysToDelete = new Set<string>();

    for (const attachment of resolvedAttachments) {
      const usages = usageMap.get(attachment.storageKey) ?? 0;

      if (usages <= 1) {
        storageKeysToDelete.add(attachment.storageKey);

        if (attachment.thumbnailKey) {
          storageKeysToDelete.add(attachment.thumbnailKey);
        }
      }
    }

    if (storageKeysToDelete.size) {
      await this.storageService.remove('message-attachments', [
        ...storageKeysToDelete,
      ]);
    }

    await this.messagesAttachmentService.deleteMany(
      resolvedAttachments.map((attachment) => attachment.id),
    );
  }
}
