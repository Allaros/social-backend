import { Injectable } from '@nestjs/common';
import { ChatEntity } from '../entities/chat.entity';
import { ChatMemberEntity } from '../entities/chat-member.entity';
import { ChatListItem, ChatTypeEnum } from '../types/chat.interface';
import { StorageService } from '@app/modules/file/services/storage.service';
import { BucketName } from '@app/modules/file/types/file.interface';
import { ProfileEntity } from '@app/modules/profile/profile.entity';
import { SELF_CHAT_KEY_PREFIX } from './chat-key.builder';

type LastMessagePreview = {
  text: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
  createdAt: string | null;
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

      return {
        id: chat.id,
        type: chat.type,
        title,
        avatarUrl,
        slug: chat.slug ?? null,
        isPublic: chat.isPublic,
        unreadCount: member.unreadCount,
        isPinned: member.isPinned,
        isMuted: member.isNotificationsMuted,
        membersCount: chat.membersCount,
        lastMessageAt: chat.lastMessageAt?.toISOString() ?? null,
        lastMessage: lastMessageMap.get(chat.id) ?? null,
        isOnline,
        identifier: this.resolveIdentifier(chat, targetProfile),
      };
    });
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
}
