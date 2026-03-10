import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ProfileEntity } from './profile.entity';
import slugify from 'slugify';
import { UserEntity } from '@app/modules/user/user.entity';
import { isPostgresUniqueViolation } from './handlers/errorHandlers';
import { CreateProfileInput } from './types/profile.interface';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  generateSlug(input: string): string {
    let baseSlug = slugify(input, {
      lower: true,
      strict: true,
      locale: 'ru',
      trim: true,
    });

    if (!baseSlug) {
      baseSlug = 'user';
    }

    const suffix = Math.floor(Math.random() * 10000);

    return `${baseSlug}-${suffix}`;
  }

  async createProfile(
    user: UserEntity,
    input: CreateProfileInput,
    manager?: EntityManager,
  ): Promise<ProfileEntity> {
    const repo = manager
      ? manager.getRepository(ProfileEntity)
      : this.profileRepository;

    const emailPrefix = user.email.split('@')[0];

    const rawName = input.name?.trim();
    const rawUsername = input.username?.toLowerCase().trim();

    const base = rawUsername || rawName || emailPrefix || 'user';

    const slug = this.generateSlug(base);

    const profile = repo.create({
      user,
      name: rawName || base,
      nickname: rawUsername || slug,
      slug,
      avatarUrl: input.avatarUrl,
    });

    try {
      return await repo.save(profile);
    } catch (e) {
      if (isPostgresUniqueViolation(e)) {
        throw new ConflictException('Username already taken');
      }
      throw e;
    }
  }
}
