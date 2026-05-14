import { Module } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ProviderEntity } from '@app/modules/auth/provider.entity';
import { SessionEntity } from '../auth/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ProviderEntity, SessionEntity]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
