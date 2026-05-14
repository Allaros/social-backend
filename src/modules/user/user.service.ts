import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserEntity } from './user.entity';
import { UserResponse } from './types/User.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { compare, hash } from 'bcrypt';
import { isPostgresUniqueViolation } from '@app/modules/profile/handlers/errorHandlers';
import { SessionEntity } from '../auth/session.entity';
import { createHash } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async createUser(
    email: string,
    passwordHash?: string,
    isVerified = false,
    manager?: EntityManager,
  ): Promise<UserEntity> {
    const repo = manager
      ? manager.getRepository(UserEntity)
      : this.userRepository;

    const normalizedEmail = email.toLowerCase().trim();

    const user = repo.create({
      email: normalizedEmail,
      passwordHash,
      isVerified,
    });

    try {
      return await repo.save(user);
    } catch (e) {
      if (isPostgresUniqueViolation(e)) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
      throw e;
    }
  }

  async verifyUser(user: UserEntity) {
    user.isVerified = true;
    await this.userRepository.save(user);
  }

  async findBySession(refreshToken: string): Promise<UserEntity> {
    const [sessionId, token] = refreshToken.split('.');

    const session = await this.sessionRepository.findOne({
      where: { id: Number(sessionId) },
      relations: ['user'],
    });

    if (!session)
      throw new ForbiddenException(
        'Время сессии истекло, или она недействительна',
      );

    const currentTokenHash = createHash('sha256').update(token).digest('hex');

    if (session.refreshTokenHash !== currentTokenHash) {
      throw new ForbiddenException('Нет доступа');
    }

    return session.user;
  }

  async findByEmail(
    email: string,
    manager?: EntityManager,
  ): Promise<UserEntity | null> {
    const repo = manager
      ? manager.getRepository(UserEntity)
      : this.userRepository;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await repo.findOne({
      where: { email: normalizedEmail },
    });

    return user;
  }

  async findById(id: number): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
    return user;
  }

  buildUserResponse(response: UserEntity): UserResponse {
    return {
      email: response.email,
      id: response.id,
      isVerified: response.isVerified,
      profile: response.profile
        ? {
            id: response.profile.id,
            name: response.profile.name,
            username: response.profile.username,
            followersCount: response.profile.followersCount,
            followingCount: response.profile.followingCount,
            postsCount: response.profile.postsCount,
            avatarUrl: response.profile.avatarUrl,
            bio: response.profile.bio,
          }
        : null,
    };
  }

  async updatePassword(user: UserEntity, password: string) {
    const isSame =
      user.passwordHash && (await compare(password, user.passwordHash));

    if (isSame) {
      throw new BadRequestException(
        'Новый пароль не должен совпадать со старым',
      );
    }

    user.passwordHash = await hash(password, 10);

    await this.userRepository.save(user);
  }
}
