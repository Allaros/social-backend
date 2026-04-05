import { Injectable } from '@nestjs/common';
import { Bucket, Format, UploadedMedia } from '../types/file.interface';
import { ImageService } from '../services/image.service';
import { generateFileName } from '../application/file.utils';
import { StorageService } from '../services/storage.service';

@Injectable()
export class UploadMediaUseCase {
  constructor(
    private readonly storageService: StorageService,
    private readonly imageService: ImageService,
  ) {}

  async execute(files: Express.Multer.File[], id: number, bucket: Bucket) {
    const uploadedMedia: UploadedMedia[] = [];

    for (const file of files) {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');

      let buffer = file.buffer;
      let fileExt: Format = 'mp4';
      let contentType = file.mimetype;
      let previewUrl: string | undefined;

      if (isImage) {
        buffer = await this.imageService.optimizePostImage(buffer);

        fileExt = 'webp';
        contentType = 'image/webp';
      }
      if (isVideo) {
        fileExt = 'mp4';
      }

      const fileName = generateFileName(`post-${Date.now()}`, id, fileExt);

      await this.storageService.upload(bucket, fileName, buffer, contentType);

      const publicUrl = this.storageService.getPublicUrl(bucket, fileName);

      uploadedMedia.push({
        url: publicUrl,
        type: isImage ? 'image' : isVideo ? 'video' : 'file',
        size: file.size,
        previewUrl,
      });
    }

    return uploadedMedia;
  }
}
