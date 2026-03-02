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

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
  ) {}

  async registerUser(
    dto: SignUpUserDto,
  ): Promise<{ user: UserEntity; tempToken: string; recoveryToken: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.userService.findByEmail(normalizedEmail);
    if (existingUser)
      throw new ConflictException('Пользователь с таким email уже существует');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.createUser(
      normalizedEmail,
      passwordHash,
    );

    const { tempToken, recoveryToken } =
      await this.verificationService.createEmailVerification(user);

    return { user, tempToken, recoveryToken };
  }

  async authorizeUser(signInDto: SignInUserDto): Promise<UserEntity> {
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

    return user;
  }
}
