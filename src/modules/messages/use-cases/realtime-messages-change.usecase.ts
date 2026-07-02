import { Injectable, Logger } from '@nestjs/common';
import { MessageResponseBuilder } from '../builders/messages-response.builder';
import EventEmitter2 from 'eventemitter2';
import { ChatEvents, MessagesEvents } from '@app/shared/events/domain-events';
import { RealtimeMessageCreatedEvent } from '../events/realtime-message-created.event';
import { MessagesQueryService } from '../services/messages-query.service';
import { ChatService } from '@app/modules/chat/services/chat.service';
import {
  ChatStateUpdateType,
  ChatTypeEnum,
  LastMessagePreview,
} from '@app/modules/chat/types/chat.interface';
import { ProfileService } from '@app/modules/profile/services/profile.service';
import { RealtimeMessagesDeletedEvent } from '../events/realtime-messages-deleted.event';
import { RealtimeMessagesReadEvent } from '../events/realtime-messages-read.event';
import { RealtimeMessageEditedEvent } from '../events/realtime-message-edited.event';
import { MessagesActionsListener } from '../listeners/messages-actions.listener';
import { ChatStateUpdatedEvent } from '@app/modules/chat/events/chat-state-updated.event';
import { resolveLastMessageText } from '@app/modules/chat/helpers/resolve-last-message-text.helper';
import { MessageEntity } from '../entities/messages.entity';
import { ChatMemberEntity } from '@app/modules/chat/entities/chat-member.entity';
import { MessagesTypeEnum } from '../types/messages.interface';

@Injectable()
export class RealtimeMessagesChangeUseCase {
  constructor(
    private readonly messagesQueryService: MessagesQueryService,
    private readonly messageResponseBuilder: MessageResponseBuilder,
    private readonly profileService: ProfileService,
    private readonly chatService: ChatService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private buildLastMessagePayload(
    message: MessageEntity | null,
    attachmentCount?: number,
  ) {
    if (!message) {
      return null;
    }

    const preview: LastMessagePreview = {
      attachmentsCount: attachmentCount ?? message.attachments.length,
      createdAt: message.createdAt.toISOString(),
      senderAvatarUrl: message.senderMember?.profile.avatarUrl ?? null,
      senderName: message.senderMember?.profile.name ?? null,
      text: message.content?.content ?? null,
    };

    return {
      createdAt: preview.createdAt,
      senderName: preview.senderName,
      textPreview: resolveLastMessageText(preview),
      type: message.senderMemberId
        ? MessagesTypeEnum.DEFAULT
        : MessagesTypeEnum.SYSTEM,
    };
  }

  private async emitForChatMembers(
    members: ChatMemberEntity[],
    chatId: number,
    type: ChatStateUpdateType,
  ) {
    for (const member of members) {
      const lastMessage =
        await this.messagesQueryService.findRealtimeLastVisibleMessage(
          chatId,
          member.id,
        );

      this.eventEmitter.emit(
        ChatEvents.REALTIME_CHAT_STATE_UPDATED,
        new ChatStateUpdatedEvent({
          chatId,
          receiverProfileId: member.profileId,
          unreadCount: member.unreadCount,
          lastMessagePayload: lastMessage
            ? this.buildLastMessagePayload(
                lastMessage.message,
                lastMessage.attachmentsCount,
              )
            : null,
          type,
        }),
      );
    }
  }

  private readonly logger = new Logger(MessagesActionsListener.name);

  async createRealtimeMessage(messageId: number, actorId: number | null) {
    const message =
      await this.messagesQueryService.findRealtimeMessage(messageId);

    if (!message) {
      return;
    }

    const chat = await this.chatService.findRealtimeChat(message.chatId);

    if (!chat) {
      return;
    }

    const identifier =
      chat.type === ChatTypeEnum.DIRECT
        ? chat.members
            .map((member) => member.profile.username)
            .find(
              (username) => username === message.senderMember?.profile.username,
            )!
        : chat.slug;

    let realtimeMessage: unknown;

    if (!actorId) {
      realtimeMessage = {
        id: message.id,
        type: message.type,
        createdAt: message.createdAt,
        isOwn: false,
        status: message.status,
        sender: null,
        forwardedFrom: null,
        editedAt: null,

        content: message.content ? { text: message.content.content } : null,

        attachments: null,

        reply: null,

        clientId: message.clientId,
      };
    } else {
      [realtimeMessage] = await this.messageResponseBuilder.buildMessages(
        [message],
        actorId,
        null,
      );
    }

    this.logger.log('Realtime message created');

    this.eventEmitter.emit(
      MessagesEvents.REALTIME_MESSAGE_CREATED,
      new RealtimeMessageCreatedEvent({
        message: realtimeMessage,
        senderProfileId: actorId,
        chatIdentifier: identifier,
        chatId: chat.id,
      }),
    );

    await this.emitForChatMembers(
      chat.members,
      chat.id,
      ChatStateUpdateType.CREATE,
    );
  }

  async deleteRealtimeMessages(
    messageIds: number[],
    actorId: number,
    chatId: number,
  ) {
    const chat = await this.chatService.findRealtimeChat(chatId);

    if (!chat) {
      return;
    }

    const actor = await this.profileService.findById(actorId);

    if (!actor) return;

    const identifier =
      chat.type === ChatTypeEnum.DIRECT
        ? chat.members
            .map((member) => member.profile.username)
            .find((username) => username === actor.username)
        : chat.slug;

    this.logger.log('Realtime message deleted');

    this.eventEmitter.emit(
      MessagesEvents.REALTIME_MESSAGE_DELETED,
      new RealtimeMessagesDeletedEvent({
        chatId: chatId,
        chatIdentifier: identifier!,
        messageIds,
      }),
    );

    await this.emitForChatMembers(
      chat.members,
      chat.id,
      ChatStateUpdateType.DELETE,
    );
  }

  async readRealtimeMessages(
    messageIds: number[],
    actorId: number,
    chatId: number,
  ) {
    const chat = await this.chatService.findRealtimeChat(chatId);

    if (!chat) {
      return;
    }

    const actor = await this.profileService.findById(actorId);

    if (!actor) {
      return;
    }

    const identifier =
      chat.type === ChatTypeEnum.DIRECT
        ? chat.members
            .map((member) => member.profile.username)
            .find((username) => username === actor.username)
        : chat.slug;

    this.logger.log('Realtime message read');

    this.eventEmitter.emit(
      MessagesEvents.REALTIME_MESSAGE_READ,
      new RealtimeMessagesReadEvent({
        chatId,
        chatIdentifier: identifier!,
        messageIds,
      }),
    );

    for (const member of chat.members) {
      this.eventEmitter.emit(
        ChatEvents.REALTIME_CHAT_STATE_UPDATED,
        new ChatStateUpdatedEvent({
          chatId: chat.id,
          receiverProfileId: member.profileId,
          unreadCount: member.unreadCount,
          lastMessagePayload: null,
          type: ChatStateUpdateType.READ,
        }),
      );
    }
  }

  async editRealtimeMessage(
    messageId: number,
    actorId: number,
    newText: string,
    chatId: number,
  ) {
    const chat = await this.chatService.findRealtimeChat(chatId);

    if (!chat) {
      return;
    }

    const actor = await this.profileService.findById(actorId);

    if (!actor) {
      return;
    }

    const identifier =
      chat.type === ChatTypeEnum.DIRECT
        ? chat.members
            .map((member) => member.profile.username)
            .find((username) => username === actor.username)
        : chat.slug;

    this.logger.log('Realtime message edited');

    this.eventEmitter.emit(
      MessagesEvents.REALTIME_MESSAGE_EDITED,
      new RealtimeMessageEditedEvent({
        chatIdentifier: identifier ?? null,
        messageId,
        newText,
        chatId,
      }),
    );

    await this.emitForChatMembers(
      chat.members,
      chat.id,
      ChatStateUpdateType.EDIT,
    );
  }

  async hideRealtimeMessages(actorProfileId: number, chatId: number) {
    const chat = await this.chatService.findRealtimeChat(chatId);

    if (!chat) {
      return;
    }

    const member = chat.members.find(
      (member) => member.profileId === actorProfileId,
    );

    if (!member) {
      return;
    }

    this.logger.log('Realtime messages hidden');

    const lastMessage =
      await this.messagesQueryService.findRealtimeLastVisibleMessage(
        chat.id,
        member.id,
      );

    this.eventEmitter.emit(
      ChatEvents.REALTIME_CHAT_STATE_UPDATED,
      new ChatStateUpdatedEvent({
        chatId: chat.id,
        receiverProfileId: actorProfileId,
        unreadCount: member.unreadCount,
        lastMessagePayload: lastMessage
          ? this.buildLastMessagePayload(
              lastMessage.message,
              lastMessage.attachmentsCount,
            )
          : null,
        type: ChatStateUpdateType.HIDE,
      }),
    );
  }
}
