import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import { Database, UploadedMedia } from './types/file.interface';

@Injectable()
export class FileService {
  private supabase: SupabaseClient<Database>;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SECRET_KEY');

    this.supabase = createClient<Database>(url!, key!);
  }

  private extractPathFromUrl(url: string) {
    const parts = url.split('/post-media/');
    return parts[1];
  }

  get client() {
    return this.supabase;
  }

  async replaceAvatar(userId: string, buffer: Buffer, oldAvatarUrl?: string) {
    if (oldAvatarUrl) {
      const fileName = this.extractPathFromUrl(oldAvatarUrl);
      if (fileName) {
        const { error } = await this.supabase.storage
          .from('avatars')
          .remove([fileName]);
        if (error) {
          console.warn('Не удалось удалить старый аватар', error.message);
        }
      }
    }
    const suffix = nanoid(6);
    const optimizedBuffer = await sharp(buffer)
      .resize(512, 512, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `user-${userId}-${suffix}.webp`;
    const { error: uploadError } = await this.supabase.storage
      .from('avatars')
      .upload(fileName, optimizedBuffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = this.supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    return data.publicUrl;
  }

  async savePostMedia(postId: number, files: Express.Multer.File[]) {
    const uploadedMedia: UploadedMedia[] = [];

    for (const file of files) {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');

      const suffix = nanoid(6);

      let buffer = file.buffer;
      let fileExt = 'bin';
      let contentType = file.mimetype;
      let previewUrl: string | undefined;

      if (isImage) {
        buffer = await sharp(file.buffer)
          .resize(1280, 1280, { fit: 'inside' })
          .webp({ quality: 80 })
          .toBuffer();

        fileExt = 'webp';
        contentType = 'image/webp';
      }

      if (isVideo) {
        fileExt = 'mp4';
      }

      const fileName = `post-${postId}/${Date.now()}-${suffix}.${fileExt}`;

      const { error: uploadError } = await this.supabase.storage
        .from('post-media')
        .upload(fileName, buffer, {
          contentType,
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = this.supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      uploadedMedia.push({
        url: data.publicUrl,
        type: isImage ? 'image' : isVideo ? 'video' : 'file',
        size: file.size,
        previewUrl,
      });
    }

    return uploadedMedia;
  }

  async deletePostMedia(mediaList: { url: string }[]) {
    const fileNames = mediaList
      .map((m) => {
        try {
          return this.extractPathFromUrl(m.url);
        } catch (err) {
          console.log(err);
          return null;
        }
      })
      .filter(Boolean);

    if (!fileNames.length) return;

    const { error: deleteError } = await this.supabase.storage
      .from('post-media')
      .remove(fileNames as string[]);

    if (deleteError) {
      console.warn('Ошибка удаления медиа поста', deleteError.message);
    }
  }
}
