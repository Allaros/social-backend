import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordRecoveryEntity } from './passwordRecovery.entity';
import { PasswordRecoveryController } from './passwordRecovery.controller';
import { PasswordRecoveryService } from './passwordRecovery.service';
import { UserModule } from '@app/user/user.module';
import { CustomMailerModule } from '@app/mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PasswordRecoveryEntity]),
    CustomMailerModule,
    UserModule,
  ],
  controllers: [PasswordRecoveryController],
  providers: [PasswordRecoveryService],
})
export class PasswordRecoveryModule {}
