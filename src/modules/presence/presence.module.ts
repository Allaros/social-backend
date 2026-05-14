import { Module } from '@nestjs/common';
import { PresenceService } from './services/presence.service';
import { RedisModule } from '../redis/redis.module';
import { PresenceListener } from './listeners/presence.listener';
import { UserModule } from '../user/user.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { WsPresenceConnectionListener } from './listeners/ws-connection-presence.listener';

@Module({
  imports: [RedisModule, UserModule, WebsocketModule],
  providers: [PresenceService, PresenceListener, WsPresenceConnectionListener],
  exports: [PresenceService],
})
export class PresenceModule {}
