import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '@app/modules/user/user.module';
import { VerificationModule } from '@app/modules/verification/verification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderEntity } from './provider.entity';
import { GoogleStrategy } from './strategies/google-strategy';
import { SessionEntity } from './session.entity';
import { ProfileModule } from '../profile/profile.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { VerificationEntity } from '../verification/verification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionEntity,
      ProviderEntity,
      VerificationEntity,
    ]),
    UserModule,
    VerificationModule,
    ProfileModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
})
export class AuthModule {}
