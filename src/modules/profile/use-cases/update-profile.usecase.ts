import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { UpdateProfileDto } from '../types/profile.dto';
import { DiskMulterFile } from '@app/modules/file/types/file.interface';
import { ReplaceAvatarUseCase } from './replace-avatar.usecase';
import { ProfileResponseBuilder } from '../builders/profile-response.builder';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    private readonly profileService: ProfileService,
    private readonly replaceAvatarUseCase: ReplaceAvatarUseCase,
    private readonly profileResponseBuilder: ProfileResponseBuilder,
  ) {}

  async execute({
    body,
    image,
    profileId,
  }: {
    profileId: number;
    body: UpdateProfileDto;
    image?: DiskMulterFile;
  }) {
    const profile = await this.profileService.findById(profileId);

    if (!profile) throw new NotFoundException('Профиль не найден');

    let avatarUrl: string | null = null;
    try {
      if (image) {
        avatarUrl = await this.replaceAvatarUseCase.execute(
          profileId,
          image.buffer,
          profile.avatarUrl,
        );
      }
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Ошибка при загрузке аватара');
    }

    const normalizedUsername = body.username?.toLowerCase().trim();

    if (normalizedUsername && normalizedUsername !== profile.username) {
      const existing =
        await this.profileService.findByUsername(normalizedUsername);
      if (existing) throw new ConflictException('Имя пользователя уже занято');
    }

    if (avatarUrl) profile.avatarUrl = avatarUrl;

    if (normalizedUsername) profile.username = normalizedUsername;

    if (body.name !== undefined) profile.name = body.name;
    if (body.bio !== undefined) profile.bio = body.bio;

    const newProfile = await this.profileService.save(profile);

    return this.profileResponseBuilder.buildSingle(newProfile, {
      isOwner: true,
    });
  }
}
