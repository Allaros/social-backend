type RealtimeMessagesReadProps = {
  chatId: number;
  chatIdentifier: string;
  messageIds: number[];
};

export class RealtimeMessagesReadEvent {
  public readonly chatId: number;
  public readonly chatIdentifier: string;
  public readonly messageIds: number[];

  constructor(props: RealtimeMessagesReadProps) {
    Object.assign(this, props);
  }
}
