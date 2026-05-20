import { Injectable } from '@nestjs/common';

import { MessageAttachmentEntity } from '../entities/messages-attachment.entity';
import { MessageEntity } from '../entities/messages.entity';
import { StorageService } from '@app/modules/file/services/storage.service';
import { BucketName } from '@app/modules/file/types/file.interface';

@Injectable()
export class MessageResponseBuilder {
  constructor(private readonly storageService: StorageService) {}

  async buildMessages(messages: MessageEntity[]) {
    const allStorageKeys = messages.flatMap(
      (message) => message.attachments?.map((a) => a.storageKey) ?? [],
    );

    const urlsMap = await this.storageService.createPresignedReadUrls(
      BucketName.MESSAGE_ATTACHMENTS,
      allStorageKeys,
    );

    return messages.map((message) => this.buildMessage(message, urlsMap));
  }

  buildMessage(message: MessageEntity, urlsMap: Map<string, string>) {
    return {
      id: message.id,
      type: message.type,
      createdAt: message.createdAt,

      sender: message.senderMember
        ? {
            id: message.senderMember.id,
            profile: message.senderMember.profile
              ? {
                  id: message.senderMember.profile.id,
                  username: message.senderMember.profile.username,
                  name: message.senderMember.profile.name,
                  avatarUrl: message.senderMember.profile.avatarUrl,
                }
              : null,
          }
        : null,

      content: message.content ? { text: message.content.content } : null,

      attachments: this.buildAttachments(message.attachments, urlsMap),

      reply: message.replyToMessage
        ? {
            id: message.replyToMessage.id,
            text: message.replyToMessage.content?.content ?? null,
          }
        : null,
    };
  }

  private buildAttachments(
    attachments: MessageAttachmentEntity[] | undefined,
    urlsMap: Map<string, string>,
  ) {
    if (!attachments?.length) return [];

    return attachments.map((attachment) => ({
      id: attachment.id,
      type: attachment.type,
      mimeType: attachment.mimeType,
      size: attachment.size,
      width: attachment.width ?? null,
      height: attachment.height ?? null,
      duration: attachment.duration ?? null,
      url: urlsMap.get(attachment.storageKey) ?? null,
    }));
  }
}
