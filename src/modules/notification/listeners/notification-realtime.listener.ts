import { Injectable } from '@nestjs/common';
import { NotificationStateChangedEvent } from '../events/notification-state-changed.event';
import { NotificationEvents } from '@app/shared/events/domain-events';
import { OnEvent } from '@nestjs/event-emitter';
import { SocketEmitterService } from '@app/modules/websocket/services/socket-emitter.service';
import { WsNotificationEvents } from '@app/shared/events/ws-events';

const notificationEventMap = {
  created: WsNotificationEvents.CREATED,
  updated: WsNotificationEvents.UPDATED,
  deleted: WsNotificationEvents.DELETED,
} satisfies Record<NotificationStateChangedEvent['type'], string>;

@Injectable()
export class NotificationRealtimeListener {
  constructor(private readonly socketEmitter: SocketEmitterService) {}

  @OnEvent(NotificationEvents.NOTIFICATION_STATE_CHANGED)
  handle(event: NotificationStateChangedEvent) {
    const currentEvent = notificationEventMap[event.type];

    this.socketEmitter.emitToNotifications(event.receiverId, currentEvent, {
      ...event,
    });
  }
}
