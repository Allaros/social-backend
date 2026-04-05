import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageService {
  async optimizePostImage(buffer: Buffer) {
    return sharp(buffer)
      .resize(1280, 1280, { fit: 'inside' })
      .webp({ quality: 80 })
      .toBuffer();
  }

  async optimizeAvatar(buffer: Buffer) {
    return sharp(buffer)
      .resize(512, 512, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();
  }
}
