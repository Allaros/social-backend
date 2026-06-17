import { Injectable, NotFoundException } from '@nestjs/common';
import { ResolveChatByIdentifierUseCase } from '@app/modules/chat/use-cases/resolve-chat-by-identifier.usecase';
import { ChatPermissionService } from '@app/modules/chat/services/chat-permission.service';
import { MessagesService } from '../services/messages.service';
import { MessagesAttachmentService } from '../services/messages-attachment.service';
import { MessagesContentService } from '../services/messages-content.service';
import { DataSource } from 'typeorm';
import { MessageContentEntity } from '../entities/messages-content.entity';
import { ApplyMessageToChatUseCase } from '@app/modules/chat/use-cases/apply-message-to-chat.usecase';
import { MessageEntity } from '../entities/messages.entity';
import { ForwardPayload } from '../types/messages.interface';
import { MessageResponseBuilder } from '../builders/messages-response.builder';

@Injectable()
export class ForwardMessagesUseCase {
  constructor(
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly chatPermissionService: ChatPermissionService,
    private readonly messagesService: MessagesService,
    private readonly messagesAttachmentsService: MessagesAttachmentService,
    private readonly messagesContentService: MessagesContentService,
    private readonly dataSource: DataSource,
    private readonly applyMessageToChatUseCase: ApplyMessageToChatUseCase,
    private readonly messageResponseBuilder: MessageResponseBuilder,
  ) {}

  async execute({
    chatIdentifier,
    currentProfileId,
    forwardPayload,
  }: {
    chatIdentifier: string;
    currentProfileId: number;
    forwardPayload: ForwardPayload[];
  }) {
    const chat = await this.resolveChatByIdentifierUseCase.execute({
      currentProfileId,
      identifier: chatIdentifier,
    });

    const member = await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: currentProfileId,
    });

    const messageIds = forwardPayload.map((item) => item.id);

    const payloadMap = new Map(forwardPayload.map((item) => [item.id, item]));

    const messages = await this.messagesService.findMany(
      messageIds,
      undefined,
      ['attachments', 'content'],
    );

    await this.ensureForwardableMessages(messages, currentProfileId);

    if (messages.length !== messageIds.length) {
      throw new NotFoundException('Некоторые сообщения не найдены');
    }

    const sortedMessages = [...messages].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const createdMessages = await this.dataSource.transaction(
      async (manager) => {
        const created: Array<{
          clientId?: string;
          id: number;
          createdAt: Date;
        }> = [];

        let lastMessage: MessageEntity | null = null;

        for (const message of sortedMessages) {
          const payload = payloadMap.get(message.id);

          let content: MessageContentEntity | null = null;

          if (message.content?.content) {
            content = await this.messagesContentService.create({
              content: message.content.content,
              isEncrypted: message.content.isEncrypted,
              manager,
            });
          }

          const newMessage = await this.messagesService.create({
            chatId: chat.id,
            contentId: content?.id ?? null,
            senderMemberId: member.id,
            type: message.type,
            hasAttachments: !!message.attachments.length,
            forwardedFromId: message.forwardedFromMessageId ?? message.id,
            clientId: payload?.clientId,
            manager,
          });

          if (message.attachments.length) {
            await this.messagesAttachmentsService.createMany({
              attachments: message.attachments.map((attachment) => ({
                mimeType: attachment.mimeType,
                size: attachment.size,
                storageKey: attachment.storageKey,
              })),
              messageId: newMessage.id,
              manager,
            });
          }

          created.push({
            clientId: payload!.clientId,
            id: newMessage.id,
            createdAt: newMessage.createdAt,
          });

          lastMessage = newMessage;
        }

        if (lastMessage) {
          await this.applyMessageToChatUseCase.execute({
            chatId: chat.id,
            createdAt: lastMessage.createdAt,
            messageId: lastMessage.id,
            excludedMemberIds: [member.id],
            manager,
          });
        }

        return created;
      },
    );

    return createdMessages;
  }

  private async ensureForwardableMessages(
    messages: MessageEntity[],
    currentProfileId: number,
  ) {
    if (messages.some((message) => message.deletedAt)) {
      throw new NotFoundException('Одно или несколько сообщений недоступны');
    }

    const uniqueChatIds = [...new Set(messages.map((m) => m.chatId))];

    for (const chatId of uniqueChatIds) {
      await this.chatPermissionService.ensureMember({
        chatId,
        profileId: currentProfileId,
      });
    }
  }
}
