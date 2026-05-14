import { Injectable } from '@nestjs/common';
import {
  extractPathFromUrl,
  generateFileName,
} from '../../file/application/file.utils';
import { StorageService } from '../../file/services/storage.service';
import { ImageService } from '../../file/services/image.service';

@Injectable()
export class ReplaceAvatarUseCase {
  constructor(
    private readonly storageService: StorageService,
    private readonly imageService: ImageService,
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
      if (oldAvatarUrl) {
        const oldPath = extractPathFromUrl(oldAvatarUrl);
        if (oldPath) {
          await this.storageService.remove('avatars', [oldPath]);
        }
      }

      return publicUrl;
    } catch (e) {
      await this.storageService.remove('avatars', [fileName]);
      throw e;
    }
  }
}
