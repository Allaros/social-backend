type MessageEditedProps = {
  actorId: number;
  messageId: number;
  newText: string;
  chatId: number;
};

export class MessageEditedEvent {
  public readonly actorId: number;
  public readonly messageId: number;
  public readonly newText: string;
  public readonly chatId: number;

  constructor(props: MessageEditedProps) {
    Object.assign(this, props);
  }
}
