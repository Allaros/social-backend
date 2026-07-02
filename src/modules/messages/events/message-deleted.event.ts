type MessageDeletedEventProps = {
  messageIds: number[];
  attachmentsIds: number[];
  chatId: number;
  actorMemberId: number;
  actorProfileId: number;
  receiverMemberIds: number[];
};

export class MessageDeletedEvent {
  public readonly messageIds: number[];
  public readonly attachmentsIds: number[];
  public readonly chatId: number;
  public readonly actorMemberId: number;
  public readonly receiverMemberIds: number[];
  public readonly actorProfileId: number;
  constructor(props: MessageDeletedEventProps) {
    Object.assign(this, props);
  }
}
