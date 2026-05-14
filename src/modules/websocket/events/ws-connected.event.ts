import { AppSocket } from '../types/ws.types';

export class WsConnectedEvent {
  constructor(
    public readonly client: AppSocket,
    public readonly profileId: number,
  ) {}
}
