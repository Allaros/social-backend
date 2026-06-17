import { Injectable, BadRequestException } from '@nestjs/common';
import { MessageAttachmentDto } from '../types/messages-attachment.dto';

@Injectable()
export class MessageAttachmentValidator {
  private readonly MAX_ATTACHMENTS = 10;

  validate(attachments?: MessageAttachmentDto[]) {
    if (!attachments?.length) {
      return;
    }

    this.validateCount(attachments);

    attachments.forEach((attachment) => {
      this.validateStorageKey(attachment.storageKey);

      this.validateMimeType(attachment.mimeType);

      this.validateSize(attachment);
    });
  }

  private validateCount(attachments: MessageAttachmentDto[]) {
    if (attachments.length > this.MAX_ATTACHMENTS) {
      throw new BadRequestException('Слишком много вложений');
    }
  }

  private validateStorageKey(storageKey: string) {
    if (!storageKey?.trim()) {
      throw new BadRequestException('Некорректный storageKey');
    }
  }

  private validateMimeType(mimeType: string) {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'audio/mpeg',
      'audio/ogg',
      'audio/webm',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException('Тип файла не поддерживается');
    }
  }

  private validateSize(attachment: MessageAttachmentDto) {
    const maxSize = 25 * 1024 * 1024;

    if (attachment.size > maxSize) {
      throw new BadRequestException('Файл слишком большой');
    }
  }
}
