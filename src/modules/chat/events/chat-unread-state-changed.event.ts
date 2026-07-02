type ChatUnreadStateChangedProps = {
  profileId: number;
  unreadChatsCountDelta: number;
  unreadMutedChatsCountDelta: number;
};

export class ChatUnreadStateChangedEvent {
  public readonly profileId: number;
  public readonly unreadChatsCountDelta: number;
  public readonly unreadMutedChatsCountDelta: number;

  constructor(props: ChatUnreadStateChangedProps) {
    Object.assign(this, props);
  }
}
