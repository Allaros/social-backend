import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ProfileEntity } from './profile.entity';
import slugify from 'slugify';
import { UserEntity } from '@app/modules/user/user.entity';
import { isPostgresUniqueViolation } from './handlers/errorHandlers';
import { CreateProfileInput } from './types/profile.interface';
import { nanoid } from 'nanoid';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  private generateUsername(name: string): string {
    const slug = slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });

    const base = slug.length >= 3 ? slug : 'user';

    const suffix = nanoid(6);

    return `${base}-${suffix}`;
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

    const profile = repo.create({
      user,
      name: rawName || base,
      username:
        rawUsername?.toLowerCase().trim() ||
        this.generateUsername(base).toLowerCase().trim(),
      avatarUrl: input.avatarUrl,
    });

    for (let i = 0; i < 5; i++) {
      try {
        return await repo.save(profile);
      } catch (err) {
        if (isPostgresUniqueViolation(err)) {
          if (rawUsername) {
            throw new ConflictException('Username already taken');
          }
          profile.username = this.generateUsername(base);
          continue;
        }

        throw err;
      }
    }

    throw new Error('Failed to generate unique username');
  }

  async findProfileByUsername(
    username: string,
    userId: number,
  ): Promise<{ profile: ProfileEntity; isOwner: boolean }> {
    console.log(username);
    const profile = await this.profileRepository.findOne({
      where: { username: username.toLowerCase().trim() },
    });

    if (!profile) throw new NotFoundException('Профиль не найден');

    const isOwner = profile.userId === userId;

    return { profile, isOwner };
  }

  buildProfileResponse(profile: ProfileEntity, isOwner: boolean) {
    return {
      isOwner,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      name: profile.name,
      username: profile.username,
      postsCount: profile.postsCount,
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
    };
  }

  async findProfiles(
    query: string,
    limit: number = 10,
    page?: number,
  ): Promise<{ data: ProfileEntity[]; total: number | null }> {
    limit = Math.min(limit, 50);

    const rawQuery = query.trim();
    const prefixQuery = `${rawQuery}%`;

    const currentSelect: string[] = page
      ? [
          'profile.id',
          'profile.name',
          'profile.username',
          'profile.avatarUrl',
          'profile.bio',
        ]
      : ['profile.id', 'profile.name', 'profile.username'];

    const qb = this.profileRepository
      .createQueryBuilder('profile')
      .select(currentSelect)
      .addSelect(
        `
      GREATEST(
        similarity(profile.username, :rawQuery) * 1.5,
        similarity(profile.name, :rawQuery)
      )
    `,
        'similarity_score',
      )
      .addSelect(
        `
      CASE
        WHEN profile.username ILIKE :prefixQuery THEN 1
        ELSE 0
      END
    `,
        'prefix_match',
      )
      .where(
        `
      profile.username ILIKE :prefixQuery
      OR profile.name ILIKE :prefixQuery
      OR profile.username % :rawQuery
      OR profile.name % :rawQuery
    `,
      )
      .orderBy('prefix_match', 'DESC')
      .addOrderBy('similarity_score', 'DESC')
      .addOrderBy('profile.followersCount', 'DESC')
      .setParameters({
        rawQuery,
        prefixQuery,
      });

    if (!page) {
      const profiles = await qb.limit(limit).getMany();
      return { data: profiles, total: null };
    }

    qb.limit(limit).offset((page - 1) * limit);

    const [profiles, total] = await qb.getManyAndCount();

    return {
      data: profiles,
      total,
    };
  }
}
