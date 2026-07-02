type MessagesHideProps = {
  messageIds: number[];
  actorProfileId: number;
  chatId: number;
};

export class MessagesHideEvent {
  public readonly messageIds: number[];
  public readonly actorProfileId: number;
  public readonly chatId: number;
  constructor(props: MessagesHideProps) {
    Object.assign(this, props);
  }
}
