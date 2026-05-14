import { AppSocket } from '../types/ws.types';

export class WsDisconnectedEvent {
  constructor(
    public readonly client: AppSocket,
    public readonly profileId: number,
  ) {}
}
