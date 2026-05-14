import { ConflictException, Injectable } from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { UserEntity } from '@app/modules/user/user.entity';
import { CreateProfileInput } from '../types/profile.interface';
import { nanoid } from 'nanoid';
import slugify from 'slugify';
import { isPostgresUniqueViolation } from '../handlers/errorHandlers';
import { EntityManager } from 'typeorm';

@Injectable()
export class CreateProfileUseCase {
  constructor(private readonly profileService: ProfileService) {}

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

  async execute(
    user: UserEntity,
    input: CreateProfileInput,
    manager?: EntityManager,
  ) {
    const emailPrefix = user.email.split('@')[0];

    const rawName = input.name?.trim();
    const rawUsername = input.username?.toLowerCase().trim();

    const base = rawUsername || rawName || emailPrefix || 'user';

    let username =
      rawUsername || this.generateUsername(base).toLowerCase().trim();

    for (let i = 0; i < 5; i++) {
      const profile = this.profileService.create({
        userId: user.id,
        name: rawName || base,
        username,
        avatarUrl: input.avatarUrl,
        manager,
      });

      try {
        return await this.profileService.save(profile, manager);
      } catch (err) {
        if (isPostgresUniqueViolation(err)) {
          if (rawUsername) {
            throw new ConflictException('Username already taken');
          }

          username = this.generateUsername(base);

          continue;
        }

        throw err;
      }
    }

    throw new Error('Failed to generate unique username');
  }
}
