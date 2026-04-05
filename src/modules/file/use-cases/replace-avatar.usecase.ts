import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  extractPathFromUrl,
  generateFileName,
} from '../application/file.utils';
import { StorageService } from '../services/storage.service';
import { ImageService } from '../services/image.service';
import { ProfileService } from '@app/modules/profile/profile.service';

@Injectable()
export class ReplaceAvatarUseCase {
  constructor(
    private readonly storageService: StorageService,
    private readonly imageService: ImageService,
    @Inject(forwardRef(() => ProfileService))
    private readonly profileService: ProfileService,
  ) {}

  async execute(profileId: number, buffer: Buffer, oldAvatarUrl?: string) {
    const optimizedBuffer = await this.imageService.optimizeAvatar(buffer);

    const fileName = generateFileName('user', profileId, 'webp');

    await this.storageService.upload(
      'avatars',
      fileName,
      optimizedBuffer,
      'image/webp',
    );

    const publicUrl = this.storageService.getPublicUrl('avatars', fileName);

    try {
      const avatar = await this.profileService.replaceAvatarUrl(
        profileId,
        publicUrl,
      );

      if (oldAvatarUrl) {
        const oldPath = extractPathFromUrl(oldAvatarUrl);
        if (oldPath) {
          await this.storageService.remove('avatars', [oldPath]);
        }
      }

      return avatar;
    } catch (e) {
      await this.storageService.remove('avatars', [fileName]);
      throw e;
    }
  }
}
