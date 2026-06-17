import { StorageService } from '@app/modules/file/services/storage.service';
import { Injectable } from '@nestjs/common';
import { MessagesAttachmentService } from '../services/messages-attachment.service';

@Injectable()
export class AttachmentCleanupService {
  constructor(
    private readonly storageService: StorageService,
    private readonly messagesAttachmentService: MessagesAttachmentService,
  ) {}

  async cleanupAttachments(attachmentsIds: number[]) {
    if (!attachmentsIds.length) return;

    const attachments =
      await this.messagesAttachmentService.findManyById(attachmentsIds);

    if (!attachments.length) return;

    const storageKeys = attachments
      .flatMap((attachment) => [attachment.storageKey, attachment.thumbnailKey])
      .filter((key): key is string => Boolean(key));

    if (storageKeys.length) {
      await this.storageService.remove('message-attachments', storageKeys);
    }

    await this.messagesAttachmentService.deleteMany(attachmentsIds);
  }
}
