import { PresenceEvents } from '@app/shared/events/domain-events';
import { Injectable } from '@nestjs/common';
import EventEmitter2 from 'eventemitter2';
import { UserOfflineEvent } from '../events/user-offline.event';

@Injectable()
export class PresenceService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitOffline(profileId: number) {
    this.eventEmitter.emit(
      PresenceEvents.USER_OFFLINE,
      new UserOfflineEvent(profileId),
    );
  }
}
