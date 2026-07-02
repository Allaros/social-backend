type ChatMarkedAsDeletedProps = {
  chatId: number;
  receiverProfileIds: number[];
};

export class ChatMarkedAsDeletedEvent {
  public readonly chatId: number;
  public readonly receiverProfileIds: number[];
  constructor(props: ChatMarkedAsDeletedProps) {
    Object.assign(this, props);
  }
}
