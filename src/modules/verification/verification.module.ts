import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationEntity } from '@app/modules/verification/verification.entity';
import { CustomMailerModule } from '@app/modules/mailer/mailer.module';
import { UserEntity } from '@app/modules/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationEntity, UserEntity]),
    CustomMailerModule,
  ],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
