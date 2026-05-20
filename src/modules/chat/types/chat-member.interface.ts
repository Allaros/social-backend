export enum ChatMemberRoleEnum {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  SUBSCRIBER = 'subscriber',
}

export interface CreateChatMemberPayload {
  profileId: number;
  role: ChatMemberRoleEnum;
}
