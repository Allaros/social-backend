type MessageCreatedProps = {
  messageId: number;
  receiverMemberIds: number[];
  actorId: number | null;
};

export class MessageCreatedEvent {
  public readonly messageId: number;
  public readonly receiverMemberIds: number[];
  public readonly actorId: number | null;
  constructor(props: MessageCreatedProps) {
    Object.assign(this, props);
  }
}
