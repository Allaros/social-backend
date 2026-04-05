import { Injectable } from '@nestjs/common';
import { StorageService } from '../services/storage.service';
import { Bucket } from '../types/file.interface';
import { extractPathFromUrl } from '../application/file.utils';

@Injectable()
export class DeleteMediaUseCase {
  constructor(private readonly storageService: StorageService) {}

  async execute(mediaList: { url: string }[], bucket: Bucket) {
    const fileNames = mediaList
      .map((m) => {
        try {
          return extractPathFromUrl(m.url);
        } catch (err) {
          console.warn('Failed to extract path', err);
          return null;
        }
      })
      .filter(Boolean);

    if (!fileNames.length) return;

    await this.storageService.remove(bucket, fileNames as string[]);
  }
}
