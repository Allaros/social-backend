import { UserEntity } from '@app/user/user.entity';
import { UserService } from '@app/user/user.service';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
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

dotenv.config();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly tokenRepository: Repository<RefreshTokenEntity>,
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
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [userIdStr, secret] = clientToken.split('.');
    if (!userIdStr || !secret) throw new UnauthorizedException();

    const userId = parseInt(userIdStr, 10);

    const tokens = await this.tokenRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    let matchedToken: null | RefreshTokenEntity = null;

    for (const tokenEntity of tokens) {
      const match = await bcrypt.compare(secret, tokenEntity.token);
      if (match) {
        matchedToken = tokenEntity;
        break;
      }
    }

    if (!matchedToken) throw new UnauthorizedException();
    if (matchedToken.expiresAt < new Date()) {
      await this.tokenRepository.remove(matchedToken);
      throw new UnauthorizedException('Refresh token истёк');
    }

    const user = matchedToken.user;
    const accessToken = this.generateAccessToken(matchedToken.user);

    await this.tokenRepository.remove(matchedToken);

    const { clientToken: refreshToken, hashedSecret } =
      await this.generateRefreshToken(user.id);
    await this.tokenRepository.save({
      token: hashedSecret,
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
  }

  async registerUser(dto: SignUpUserDto): Promise<{
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
    });

    const { tempToken, recoveryToken } =
      await this.verificationService.createEmailVerification(user);

    return { user, tempToken, recoveryToken, accessToken, refreshToken };
  }

  async authorizeUser(
    signInDto: SignInUserDto,
  ): Promise<{ user: UserEntity; refreshToken: string; accessToken: string }> {
    const user = await this.userService.findByEmail(signInDto.email);

    if (!user) throw new UnauthorizedException('Неправильный логин или пароль');

    if (!user.isVerified) {
      throw new ForbiddenException({
        statusCode: 403,
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

    await this.tokenRepository.delete({ user: user });

    const accessToken = this.generateAccessToken(user);

    const { clientToken: refreshToken, hashedSecret } =
      await this.generateRefreshToken(user.id);

    await this.tokenRepository.save({
      token: hashedSecret,
      user: user,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    return { user, refreshToken, accessToken };
  }
}
