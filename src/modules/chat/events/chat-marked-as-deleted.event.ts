type ChatMarkedAsDeletedProps = {
  chatId: number;
};

export class ChatMarkedAsDeletedEvent {
  public readonly chatId: number;
  constructor(props: ChatMarkedAsDeletedProps) {
    Object.assign(this, props);
  }
}
