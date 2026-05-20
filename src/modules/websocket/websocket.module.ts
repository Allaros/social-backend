import { Module } from '@nestjs/common';
import { AppGateway } from './gateways/app.gateway';
import { SocketEmitterService } from './services/socket-emitter.service';
import { UserModule } from '../user/user.module';
import { PresenceStateService } from './services/presence-state.service';

@Module({
  imports: [UserModule],
  providers: [AppGateway, SocketEmitterService, PresenceStateService],
  exports: [SocketEmitterService, PresenceStateService],
})
export class WebsocketModule {}
