import { Module } from '@nestjs/common';
import { AppGateway } from './gateways/app.gateway';
import { SocketEmitterService } from './services/socket-emitter.service';
import { UserModule } from '../user/user.module';
import { PresenceStateService } from './services/presence-state.service';
import { PresenceCacheService } from './services/presence-cache.service';
import { RedisModule } from '../redis/redis.module';
import { PresenceBootstrapService } from './services/presence-bootstrap.service';

@Module({
  imports: [UserModule, RedisModule],
  providers: [
    AppGateway,
    SocketEmitterService,
    PresenceStateService,
    PresenceCacheService,
    PresenceBootstrapService,
  ],
  exports: [SocketEmitterService, PresenceStateService],
})
export class WebsocketModule {}
