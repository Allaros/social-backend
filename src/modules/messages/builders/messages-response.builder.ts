import { Injectable } from '@nestjs/common';

import { MessageAttachmentEntity } from '../entities/messages-attachment.entity';
import { MessageEntity } from '../entities/messages.entity';
import { StorageService } from '@app/modules/file/services/storage.service';
import { BucketName } from '@app/modules/file/types/file.interface';
import { ChatMemberEntity } from '@app/modules/chat/entities/chat-member.entity';

@Injectable()
export class MessageResponseBuilder {
  constructor(private readonly storageService: StorageService) {}

  async buildMessages(
    messages: MessageEntity[],
    currentProfileId: number,
    lastReadMessageId: number | null,
  ) {
    const allStorageKeys = messages.flatMap(
      (message) => message.attachments?.map((a) => a.storageKey) ?? [],
    );

    const urlsMap = await this.storageService.createPresignedReadUrls(
      BucketName.MESSAGE_ATTACHMENTS,
      allStorageKeys,
    );

    return messages.map((message) =>
      this.buildMessage(message, urlsMap, currentProfileId, lastReadMessageId),
    );
  }

  buildMessage(
    message: MessageEntity,
    urlsMap: Map<string, string>,
    currentProfileId: number,
    lastReadMessageId: number | null,
  ) {
    return {
      id: message.id,
      type: message.type,
      createdAt: message.createdAt,
      isOwn: message.senderMember?.profileId === currentProfileId,
      status:
        lastReadMessageId && message.id <= lastReadMessageId
          ? 'read'
          : message.status,
      sender: this.buildSender(message.senderMember),
      forwardedFrom: this.buildForwardedMessage(message.forwardedFromMessage),
      editedAt: message.editedAt,

      content: message.content ? { text: message.content.content } : null,

      attachments: this.buildAttachments(message.attachments, urlsMap),

      reply: message.replyToMessage
        ? {
            id: message.replyToMessage.id,
            text: message.replyToMessage.content?.content ?? null,
            authorName:
              message.replyToMessage.senderMember?.profile.name ?? 'Инкогнито',
          }
        : null,

      clientId: message.clientId,
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

  private buildSender(senderMember?: ChatMemberEntity | null) {
    if (!senderMember) {
      return null;
    }

    return {
      id: senderMember.id,

      profile: senderMember.profile
        ? {
            id: senderMember.profile.id,
            username: senderMember.profile.username,
            name: senderMember.profile.name,
            avatarUrl: senderMember.profile.avatarUrl,
          }
        : null,
    };
  }

  private buildForwardedMessage(message?: MessageEntity | null) {
    if (!message) {
      return null;
    }

    return {
      id: message.id,

      sender: this.buildSender(message.senderMember),
    };
  }
}
