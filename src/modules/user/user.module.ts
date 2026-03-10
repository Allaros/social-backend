import { Module } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ProviderEntity } from '@app/modules/auth/provider.entity';
import { ProfileModule } from '@app/modules/profile/profile.module';
import { SessionEntity } from '../auth/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ProviderEntity, SessionEntity]),
    ProfileModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
