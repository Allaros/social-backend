import { UserEntity } from '@app/user/user.entity';
import { UserService } from '@app/user/user.service';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInUserDto, SignUpUserDto } from './types/Auth.dto';
import bcrypt, { compare } from 'bcrypt';
import { VerificationService } from '@app/verification/verification.service';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenEntity } from './token.entity';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { randomBytes } from 'crypto';
import { Request } from 'express';
import { AuthProvider, GoogleOAuthUser } from './types/Auth.interface';
import { ProviderEntity } from './provider.entity';

dotenv.config();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly tokenRepository: Repository<RefreshTokenEntity>,
    @InjectRepository(ProviderEntity)
    private readonly providerRepo: Repository<ProviderEntity>,
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
  ) {}

  generateAccessToken(user: UserEntity): string {
    return sign(
      {
        sub: String(user.id),
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' },
    );
  }

  private async issueTokens(
    user: UserEntity,
    req: Request,
  ): Promise<{ refreshToken: string; accessToken: string }> {
    const platform =
      req.get('sec-ch-ua-platform')?.replace(/"/g, '') ?? 'unknown';

    await this.tokenRepository.update(
      {
        user: { id: user.id },
        device: platform,
        revoked: false,
      },
      {
        revoked: true,
      },
    );

    const accessToken = this.generateAccessToken(user);

    const { clientToken: refreshToken, hashedSecret } =
      await this.generateRefreshToken(user.id);

    await this.tokenRepository.save({
      token: hashedSecret,
      user,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      device: platform,
      userAgent: req.get('user-agent') ?? 'unknown',
      ip: req.ip,
    });

    return { refreshToken, accessToken };
  }

  async generateRefreshToken(
    userId: number,
  ): Promise<{ clientToken: string; hashedSecret: string }> {
    const randomSecret = randomBytes(64).toString('hex');
    const clientToken = `${userId}.${randomSecret}`;
    const hashedSecret = await bcrypt.hash(randomSecret, 10);

    return { clientToken, hashedSecret };
  }

  async refreshAccessToken(
    clientToken: string,
    req: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [userIdStr, secret] = clientToken.split('.');
    if (!userIdStr || !secret) throw new UnauthorizedException();

    const userId = parseInt(userIdStr, 10);

    const tokens = await this.tokenRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    let matchedToken: RefreshTokenEntity | null = null;

    for (const tokenEntity of tokens) {
      const match = await bcrypt.compare(secret, tokenEntity.token);
      if (match) {
        matchedToken = tokenEntity;
        break;
      }
    }

    if (!matchedToken) throw new UnauthorizedException();

    if (matchedToken.revoked) {
      await this.tokenRepository.update(
        { user: { id: userId }, revoked: false },
        { revoked: true },
      );

      throw new UnauthorizedException('Token reuse detected');
    }

    if (matchedToken.expiresAt < new Date()) {
      await this.tokenRepository.update(
        { id: matchedToken.id },
        { revoked: true },
      );

      throw new UnauthorizedException('Refresh token истёк');
    }

    const user = matchedToken.user;
    await this.tokenRepository.update(
      { id: matchedToken.id },
      { revoked: true },
    );

    const { clientToken: newRefreshToken, hashedSecret } =
      await this.generateRefreshToken(user.id);

    await this.tokenRepository.save({
      token: hashedSecret,
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
      device: matchedToken.device,
      userAgent: req.get('user-agent') ?? 'unknown',
      ip: req.ip,
    });
    const accessToken = this.generateAccessToken(matchedToken.user);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async registerUser(
    dto: SignUpUserDto,
    req: Request,
  ): Promise<{
    user: UserEntity;
    tempToken: string;
    recoveryToken: string;
    accessToken: string;
    refreshToken: string;
  }> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.userService.findByEmail(normalizedEmail);
    if (existingUser)
      throw new ConflictException('Пользователь с таким email уже существует');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.createUser(
      normalizedEmail,
      passwordHash,
    );

    const accessToken = this.generateAccessToken(user);
    const { clientToken: refreshToken, hashedSecret } =
      await this.generateRefreshToken(user.id);

    await this.tokenRepository.save({
      token: hashedSecret,
      user: user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: req.get('sec-ch-ua-platform') ?? 'unknown',
      userAgent: req.get('user-agent') ?? 'unknown',
      ip: req.ip,
    });

    const { tempToken, recoveryToken } =
      await this.verificationService.createEmailVerification(user);

    return { user, tempToken, recoveryToken, accessToken, refreshToken };
  }

  async authorizeUser(signInDto: SignInUserDto, req: Request) {
    const user = await this.userService.findByEmail(signInDto.email);

    if (!user) throw new UnauthorizedException('Неправильный логин или пароль');

    if (!user.isVerified) {
      throw new ForbiddenException({
        message: 'Email не верифицирован',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    if (!user.passwordHash)
      throw new UnauthorizedException('Неправильный логин или пароль');

    const isPasswordMatch = await compare(
      signInDto.password,
      user.passwordHash,
    );

    if (!isPasswordMatch)
      throw new UnauthorizedException('Неправильный логин или пароль');
    const tokens = await this.issueTokens(user, req);

    return { user, ...tokens };
  }

  async oauthLogin(oauthUser: GoogleOAuthUser, req: Request) {
    const user = await this.validateOAuthLogin(oauthUser);

    const tokens = await this.issueTokens(user, req);

    return { user, ...tokens };
  }

  async logoutCurrent(userId: number, req: Request): Promise<void> {
    const platform =
      req.get('sec-ch-ua-platform')?.replace(/"/g, '') ??
      req.get('user-agent') ??
      'unknown';

    await this.tokenRepository.update(
      {
        user: { id: userId },
        device: platform,
        revoked: false,
      },
      {
        revoked: true,
      },
    );
  }

  async logoutAll(userId: number): Promise<void> {
    await this.tokenRepository.update(
      {
        user: { id: userId },
        revoked: false,
      },
      {
        revoked: true,
      },
    );
  }

  async validateOAuthLogin(oauthUser: {
    provider: AuthProvider;
    providerId: string;
    email: string;
  }) {
    try {
      const { email, provider, providerId } = oauthUser;

      const existingProvider = await this.providerRepo.findOne({
        where: { provider, providerId },
        relations: ['user'],
      });

      if (existingProvider) {
        return existingProvider.user;
      }

      let user = await this.userService.findByEmail(email);

      if (!user) {
        try {
          user = await this.userService.createUser(email, undefined, true);
        } catch (err) {
          console.error('CREATE USER ERROR:', err);
          user = await this.userService.findByEmail(email);
        }
      }

      if (!user) {
        throw new InternalServerErrorException('OAuth user resolution failed');
      }

      if (!user.isVerified) {
        await this.userService.verifyUser(user);
      }

      const newProvider = this.providerRepo.create({
        provider,
        providerId,
        user,
      });

      await this.providerRepo.save(newProvider);

      return user;
    } catch (error) {
      console.error('VALIDATE OAUTH ERROR:', error);
      throw error;
    }
  }
}
