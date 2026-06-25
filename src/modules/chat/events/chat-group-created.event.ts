type ChatGroupCreatedProps = {
  chatId: number;
  invitedProfileIds: number[];
  ownerId: number;
};

export class ChatGroupCreatedEvent {
  public readonly chatId: number;
  public readonly invitedProfileIds: number[];
  public readonly ownerId: number;
  constructor(props: ChatGroupCreatedProps) {
    Object.assign(this, props);
  }
}
