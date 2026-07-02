type RealtimeMessagesDeletedProps = {
  chatId: number;
  chatIdentifier: string;
  messageIds: number[];
};

export class RealtimeMessagesDeletedEvent {
  public readonly chatId: number;
  public readonly chatIdentifier: string;
  public readonly messageIds: number[];

  constructor(props: RealtimeMessagesDeletedProps) {
    Object.assign(this, props);
  }
}
