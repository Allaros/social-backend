type RealtimeMessageCreatedProps = {
  senderProfileId: number | null;
  chatIdentifier: string | null;
  message: unknown;
  chatId: number;
};

export class RealtimeMessageCreatedEvent {
  public readonly senderProfileId: number | null;
  public readonly message: unknown;
  public readonly chatIdentifier: string;
  public readonly chatId: number;
  constructor(props: RealtimeMessageCreatedProps) {
    Object.assign(this, props);
  }
}
