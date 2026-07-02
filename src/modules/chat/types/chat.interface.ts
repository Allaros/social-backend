export enum ChatTypeEnum {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel',
}

export type CreateChatPayload =
  | DirectChatInterface
  | GroupChatInterface
  | ChannelInterface;

export interface GroupChatInterface {
  type: ChatTypeEnum.GROUP;
  title: string;
  isPublic: boolean;
  slug: string;
  description?: string;
  avatarStorageKey?: string;
  membersCount: number;
}

export interface ChannelInterface {
  type: ChatTypeEnum.CHANNEL;
  title: string;
  isPublic: boolean;
  slug: string;
  description?: string;
  avatarStorageKey?: string;
  membersCount: number;
}

export interface DirectChatInterface {
  type: ChatTypeEnum.DIRECT;
  directKey: string;
  membersCount: number;
}

export type ChatListItem = {
  id: number;
  type: ChatTypeEnum;
  title: string | null;
  avatarUrl: string | null;
  slug?: string | null;
  isPublic: boolean;
  lastMessageAt: string | null;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  membersCount: number;
};

export type LastMessagePreview = {
  text: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
  createdAt: string | null;
  attachmentsCount: number;
};

export enum ChatStateUpdateType {
  CREATE = 'create',
  DELETE = 'delete',
  EDIT = 'edit',
  READ = 'read',
  HIDE = 'hide',
}
