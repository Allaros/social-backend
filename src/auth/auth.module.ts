import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '@app/user/user.module';
import { VerificationModule } from '@app/verification/verification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from './token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    UserModule,
    VerificationModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
