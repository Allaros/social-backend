type MessageDeletedEventProps = {
  messageIds: number[];
  attachmentsIds: number[];
  chatId: number;
};

export class MessageDeletedEvent {
  public readonly messageIds: number[];
  public readonly attachmentsIds: number[];
  public readonly chatId: number;
  constructor(props: MessageDeletedEventProps) {
    Object.assign(this, props);
  }
}
