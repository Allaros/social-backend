import { ChatStateUpdateType } from '../types/chat.interface';

type ChatStateUpdatedProps = {
  chatId: number;
  lastMessagePayload: {
    textPreview: string | null;
    senderName: string | null;
    createdAt: string | null;
  } | null;
  unreadCount: number;
  receiverProfileId: number;
  type: ChatStateUpdateType;
};

export class ChatStateUpdatedEvent {
  public readonly chatId: number;
  public readonly lastMessagePayload: {
    textPreview: string | null;
    senderName: string | null;
    createdAt: string | null;
  } | null;
  public readonly unreadCount: number;
  public readonly receiverProfileId: number;
  public readonly type: ChatStateUpdateType;
  constructor(props: ChatStateUpdatedProps) {
    Object.assign(this, props);
  }
}
