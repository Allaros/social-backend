export enum MessagesTypeEnum {
  DEFAULT = 'default',

  SYSTEM = 'system',

  CALL = 'call',
}

export enum MessageStatusEnum {
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
}

export type ForwardPayload = {
  id: number;
  clientId?: string;
};
