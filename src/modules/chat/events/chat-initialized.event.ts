type ChatInitializedProps = {
  chatId: number;
};

export class ChatInitializedEvent {
  public readonly chatId: number;
  constructor(props: ChatInitializedProps) {
    Object.assign(this, props);
  }
}
