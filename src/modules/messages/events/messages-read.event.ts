type MessagesReadProps = {
  messageIds: number[];
  memberId: number;
  profileId: number;
  chatId: number;
};

export class MessagesReadEvent {
  public readonly messageIds: number[];
  public readonly memberId: number;
  public readonly profileId: number;
  public readonly chatId: number;
  constructor(props: MessagesReadProps) {
    Object.assign(this, props);
  }
}
