import { Injectable } from '@nestjs/common';
import { ChatEntity } from '../entities/chat.entity';
import { ChatMemberEntity } from '../entities/chat-member.entity';
import { ChatListItem, ChatTypeEnum } from '../types/chat.interface';
import { StorageService } from '@app/modules/file/services/storage.service';
import { BucketName } from '@app/modules/file/types/file.interface';
import { ProfileEntity } from '@app/modules/profile/entities/profile.entity';
import { SELF_CHAT_KEY_PREFIX } from './chat-key.builder';

type LastMessagePreview = {
  text: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
  createdAt: string | null;
  attachmentsCount: number;
};

@Injectable()
export class ChatResponseBuilder {
  constructor(private readonly storageService: StorageService) {}
  buildCreationResponse({
    chat,
    identifier,
    title,
    avatarUrl,
    message = null,
  }: {
    chat: ChatEntity;
    identifier: string;
    title: string;
    avatarUrl?: string | null;
    message?: string | null;
  }) {
    return {
      id: chat.id,
      type: chat.type,
      identifier,
      title,
      avatarUrl: avatarUrl ?? null,
      createdAt: chat.createdAt,
      lastMessageAt: null,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      membersCount: chat.membersCount,
      lastMessage: null,
      message,
    };
  }

  buildChatList({
    members,
    directTargetsMap,
    lastMessageMap,
    onlineStatusMap,
  }: {
    members: ChatMemberEntity[];
    directTargetsMap: Map<number, ProfileEntity>;
    lastMessageMap: Map<number, LastMessagePreview>;
    onlineStatusMap: Map<number, boolean>;
  }): ChatListItem[] {
    return members.map((member) => {
      const chat = member.chat;
      const isDirectChat = chat.type === ChatTypeEnum.DIRECT;
      const isSelfChat =
        isDirectChat && chat.directKey?.startsWith(SELF_CHAT_KEY_PREFIX);
      const targetProfile = isDirectChat ? directTargetsMap.get(chat.id) : null;

      const title = isSelfChat
        ? 'Saved messages'
        : isDirectChat
          ? (targetProfile?.name ?? 'Unknown user')
          : (chat.title ?? null);

      const isOnline =
        isDirectChat && !isSelfChat
          ? (onlineStatusMap.get(targetProfile?.id ?? 0) ?? false)
          : false;

      const avatarUrl = isSelfChat
        ? null
        : isDirectChat
          ? (targetProfile?.avatarUrl ?? null)
          : chat.avatarStorageKey
            ? this.storageService.getPublicUrlFromKey(
                BucketName.CHAT_AVATARS,
                chat.avatarStorageKey,
              )
            : null;

      const lastMessage = lastMessageMap.get(chat.id);

      return {
        id: chat.id,
        type: chat.type,
        title,
        avatarUrl,
        isPublic: chat.isPublic,
        unreadCount: member.unreadCount,
        isPinned: member.isPinned,
        isMuted: member.isNotificationsMuted,
        membersCount: chat.membersCount,
        lastMessageAt: chat.lastMessageAt?.toISOString() ?? null,
        lastMessage: lastMessage
          ? {
              ...lastMessage,
              text: this.resolveLastMessageText(lastMessage),
            }
          : null,
        isOnline,
        identifier: this.resolveIdentifier(chat, targetProfile),
        isDeleted: chat.deletedAt,
      };
    });
  }

  buildSingleChat({
    chat,
    type,
    target,
    isOnline,
    isSelfChat,
    isMuted,
    isLeft,
    canSendMessages,
  }: {
    chat: ChatEntity;
    type: ChatTypeEnum;
    target: ProfileEntity | null;
    isOnline: boolean;
    isSelfChat: boolean;
    isMuted: boolean;
    isLeft: boolean;
    canSendMessages: boolean;
  }) {
    const base = {
      id: chat.id,
      type: chat.type,
      membersCount: chat.membersCount,
      isPublic: chat.isPublic,
      slug: chat.slug ?? null,
    };
    if (type === ChatTypeEnum.DIRECT && isSelfChat) {
      return {
        ...base,
        title: 'Saved messages',
        avatarUrl: null,
        username: null,
        name: null,
        lastSeenAt: null,
        isOnline: false,
        isSelfChat: true,
        isMuted,
        description: null,
        isLeft,
        canSendMessages,
      };
    }

    if (type === ChatTypeEnum.DIRECT) {
      return {
        ...base,
        title: target?.name ?? 'Unknown user',
        avatarUrl: target?.avatarUrl ?? null,
        username: target?.username ?? null,
        name: target?.name,
        lastSeenAt: target?.lastSeenAt ?? null,
        isOnline,
        isSelfChat: false,
        isMuted,
        description: null,
        isLeft,
        canSendMessages,
      };
    }

    const avatarUrl = chat.avatarStorageKey
      ? this.storageService.getPublicUrlFromKey(
          BucketName.CHAT_AVATARS,
          chat.avatarStorageKey,
        )
      : null;

    return {
      ...base,
      title: chat.title ?? null,
      avatarUrl,
      username: null,
      name: null,
      lastSeenAt: null,
      isOnline: false,
      isSelfChat: false,
      isMuted,
      description: chat.description ?? null,
      isLeft,
      canSendMessages,
    };
  }

  private resolveIdentifier(
    chat: ChatEntity,
    targetProfile?: ProfileEntity | null,
  ): string {
    if (chat.type === ChatTypeEnum.DIRECT) {
      return targetProfile?.username ?? String(chat.id);
    }

    return chat.slug ?? String(chat.id);
  }

  private resolveLastMessageText(
    lastMessage: LastMessagePreview,
  ): string | null {
    if (lastMessage.text?.trim()) {
      return lastMessage.text;
    }

    const count = lastMessage.attachmentsCount;

    if (count > 0) {
      if (count === 1) {
        return '1 вложение';
      }

      if (count >= 2 && count <= 4) {
        return `${count} вложения`;
      }

      return `${count} вложений`;
    }

    return null;
  }
}
