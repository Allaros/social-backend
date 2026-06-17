import { Injectable } from '@nestjs/common';
import { AttachmentCleanupService } from '../application/attachments-cleanup.service';
import { OnEvent } from '@nestjs/event-emitter';
import { MessagesEvents } from '@app/shared/events/domain-events';
import { MessageDeletedEvent } from '../events/message-deleted.event';

@Injectable()
export class MessagesCleanupListener {
  constructor(
    private readonly attachmentsCleanupService: AttachmentCleanupService,
  ) {}

  @OnEvent(MessagesEvents.MESSAGE_DELETED)
  async deleteAttachments(event: MessageDeletedEvent) {
    await this.attachmentsCleanupService.cleanupAttachments(
      event.attachmentsIds,
    );
  }
}
