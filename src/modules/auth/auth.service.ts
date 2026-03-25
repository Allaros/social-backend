import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthProvider, OAuthUser } from './types/Auth.interface';
import { CreateProfileInput } from '../profile/types/profile.interface';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderEntity } from './provider.entity';
import { DataSource, IsNull, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/user.entity';
import { ProfileService } from '../profile/profile.service';
import { SessionEntity } from './session.entity';
import { sign } from 'jsonwebtoken';
import { createHash, createHmac, randomBytes, randomUUID } from 'crypto';
import {
  ChangePasswordDto,
  SignInUserDto,
  SignUpUserDto,
} from './types/Auth.dto';
import bcrypt from 'bcrypt';
import { VerificationService } from '../verification/verification.service';
import { ConfigService } from '@nestjs/config';
import { UAParser } from 'ua-parser-js';
import { VerificationType } from '../verification/types/verification.interface';
import { VerificationEntity } from '../verification/verification.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    @InjectRepository(VerificationEntity)
    private readonly verificationRepository: Repository<VerificationEntity>,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly verificationService: VerificationService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(user: UserEntity): string {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret)
      throw new InternalServerErrorException('Укажите jwt secret');
    return sign(
      {
        sub: String(user.id),
      },
      jwtSecret,
      { expiresIn: '15m' },
    );
  }

  generateRefreshToken(): { token: string; hashedToken: string } {
    const token = randomBytes(64).toString('hex');

    const hashedToken = createHash('sha256').update(token).digest('hex');

    return { token, hashedToken };
  }

  private async issueTokens(
    user: UserEntity,
    req: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const MAX_SESSIONS = this.configService.get<number>('MAX_SESSIONS');

    if (MAX_SESSIONS == null) {
      throw new InternalServerErrorException('MAX_SESSIONS not configured');
    }

    const parser = new UAParser(req.get('user-agent'));

    const device = parser.getDevice().type ?? 'desktop';
    const platform = parser.getOS().name ?? 'unknown';

    const { token, hashedToken } = this.generateRefreshToken();

    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';

    await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where(
        `
      id IN (
        SELECT id FROM "sessions"
        WHERE "userId" = :userId
        ORDER BY "createdAt" ASC
        OFFSET :limit
      )
        `,
      )
      .setParameters({
        userId: user.id,
        limit: MAX_SESSIONS - 1,
      })
      .execute();

    const session = await this.sessionRepository.save({
      user,
      ip,
      userAgent: req.get('user-agent') ?? 'unknown',
      device,
      platform,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      refreshTokenHash: hashedToken,
    });

    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: `${session.id}.${token}`,
    };
  }

  private async registerWithProvider(
    params: {
      email: string;
      passwordHash?: string;
      provider: AuthProvider;
      providerId: string;
      profile?: CreateProfileInput;
      isVerified?: boolean;
    },
    req: Request,
  ) {
    const { email, provider, providerId, isVerified, passwordHash, profile } =
      params;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.dataSource.transaction(async (manager) => {
      const existingProvider = await manager.findOne(ProviderEntity, {
        where: { provider, providerId },
        relations: ['user'],
      });

      if (existingProvider) {
        if (provider === AuthProvider.PASSWORD) {
          throw new ConflictException('Email already registered');
        }

        return existingProvider.user;
      }

      const existingUser = await this.userService.findByEmail(
        normalizedEmail,
        manager,
      );

      let user: UserEntity;

      if (!existingUser) {
        user = await this.userService.createUser(
          normalizedEmail,
          passwordHash,
          isVerified ?? false,
          manager,
        );

        await this.profileService.createProfile(user, profile ?? {}, manager);
      } else {
        user = existingUser;

        if (!user.isVerified && isVerified) {
          user.isVerified = true;
          await manager.save(user);
        }
      }

      const newProvider = manager.create(ProviderEntity, {
        provider,
        providerId,
        user,
      });

      await manager.save(newProvider);

      return user;
    });

    const { accessToken, refreshToken } = await this.issueTokens(user, req);

    return { user, accessToken, refreshToken };
  }

  async registerWithPassword(dto: SignUpUserDto, req: Request) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    return await this.registerWithProvider(
      {
        email: dto.email,
        provider: AuthProvider.PASSWORD,
        providerId: randomUUID(),
        profile: {
          name: dto.name,
          username: dto.username,
        },
        passwordHash,
      },
      req,
    );
  }

  async registerWithGoogle(oauthuser: OAuthUser, req: Request) {
    return this.registerWithProvider(
      {
        email: oauthuser.email,
        provider: oauthuser.provider,
        providerId: oauthuser.providerId,
        isVerified: oauthuser.isVerified,
        profile: oauthuser.profile,
      },
      req,
    );
  }

  private magicProviderId(userId: string) {
    const secret = this.configService.get<string>('MAGIC_PROVIDER_SECRET');

    if (!secret) {
      throw new Error('MAGIC_PROVIDER_SECRET is not defined');
    }
    return createHmac('sha256', secret).update(userId).digest('hex');
  }

  async loginWithMagicLink(token: string, req: Request) {
    const verification = await this.verificationService.verifyVerification(
      token,
      VerificationType.MAGIC_LINK,
    );

    const user = verification.user;

    if (!user) {
      throw new ForbiddenException('User not found for verification');
    }

    return this.registerWithProvider(
      {
        email: user.email,
        provider: AuthProvider.MAGIC,
        providerId: this.magicProviderId(`${user.id}`),
        isVerified: true,
      },
      req,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async refresh(refreshToken: string, req: Request) {
    // const parser = new UAParser(req.get('user-agent'));

    // const device = parser.getDevice().type ?? 'desktop';
    // const platform = parser.getOS().name ?? 'unknown';

    const [sessionId, secret] = refreshToken.split('.');

    if (!sessionId || !secret) {
      throw new UnauthorizedException();
    }

    const id = Number(sessionId);

    if (!Number.isInteger(id)) {
      throw new UnauthorizedException();
    }

    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    if (session.expiresAt < new Date() || session.revokedAt) {
      await this.sessionRepository.update(session.id, {
        revokedAt: new Date(),
      });

      throw new UnauthorizedException();
    }

    const secretHash = createHash('sha256').update(secret).digest('hex');

    if (secretHash !== session.refreshTokenHash) {
      await this.sessionRepository.delete(session.id);

      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const { token, hashedToken } = this.generateRefreshToken();

    const result = await this.sessionRepository.update(
      {
        id: session.id,
        refreshTokenHash: secretHash,
        revokedAt: IsNull(),
      },
      {
        refreshTokenHash: hashedToken,
        lastUsedAt: new Date(),
      },
    );

    if (result.affected === 0) {
      throw new UnauthorizedException('Refresh already used');
    }

    const accessToken = this.generateAccessToken(session.user);

    return {
      accessToken,
      refreshToken: `${session.id}.${token}`,
    };
  }

  async authorizeUser(
    dto: SignInUserDto,
    req: Request,
  ): Promise<{
    user: UserEntity;
    accessToken: string;
    refreshToken: string;
    verificationToken: string | null;
  }> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.userService.findByEmail(normalizedEmail);

    const hash =
      user?.passwordHash ?? '$2b$10$invalidsaltinvalidsaltinvalidsalti';

    const passwordMatches = await bcrypt.compare(dto.password, hash);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    let verificationToken: string | null = null;
    if (!user.isVerified) {
      verificationToken = await this.verificationService.createNewVerification(
        VerificationType.EMAIL,
        user,
      );
    }

    const { accessToken, refreshToken } = await this.issueTokens(user, req);

    return { user, accessToken, refreshToken, verificationToken };
  }

  async logout(refreshToken: string) {
    const parts = refreshToken.split('.');

    if (parts.length !== 2) return;

    const sessionId = Number(parts[0]);

    if (!Number.isInteger(sessionId)) return;

    await this.sessionRepository.delete(sessionId);
  }

  async logoutAll(userId: number) {
    await this.sessionRepository.delete({
      user: { id: userId },
    });
  }

  async changeUserPassword(dto: ChangePasswordDto): Promise<void> {
    const verification = await this.verificationService.verifyVerification(
      dto.token,
      VerificationType.PASSWORD_RESET,
      undefined,
      false,
    );

    await this.userService.updatePassword(verification.user, dto.password);

    await this.verificationRepository.update(verification.id, {
      usedAt: new Date(),
    });

    await this.sessionRepository.delete({
      user: { id: verification.user.id },
    });
  }
}
