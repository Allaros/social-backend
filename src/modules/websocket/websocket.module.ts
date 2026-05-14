import { Module } from '@nestjs/common';
import { AppGateway } from './gateways/app.gateway';
import { SocketEmitterService } from './services/socket-emitter.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [AppGateway, SocketEmitterService],
  exports: [SocketEmitterService],
})
export class WebsocketModule {}
