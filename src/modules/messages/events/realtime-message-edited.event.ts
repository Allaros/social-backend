type RealtimeMessageEditedProps = {
  messageId: number;
  newText: string;
  chatIdentifier: string | null;
  chatId: number;
};

export class RealtimeMessageEditedEvent {
  public readonly messageId: number;
  public readonly newText: string;
  public readonly chatIdentifier: string;
  public readonly chatId: number;

  constructor(props: RealtimeMessageEditedProps) {
    Object.assign(this, props);
  }
}
