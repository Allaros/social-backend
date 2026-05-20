import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Bucket, BucketName, Database } from '../types/file.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient<Database>;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SECRET_KEY');

    this.supabase = createClient<Database>(url!, key!);
  }

  async upload(
    bucket: Bucket,
    path: string,
    buffer: Buffer,
    contentType: string,
  ) {
    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType });

    if (error) throw new InternalServerErrorException(error.message);
  }

  async remove(bucket: Bucket, paths: string[]) {
    const { error } = await this.supabase.storage.from(bucket).remove(paths);

    if (error) throw new InternalServerErrorException(error.message);
  }

  getPublicUrl(bucket: Bucket, path: string) {
    return this.supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  getPublicUrlFromKey(bucket: BucketName, storageKey: string) {
    return this.supabase.storage.from(bucket).getPublicUrl(storageKey).data
      .publicUrl;
  }

  async createPresignedUploadUrl(bucket: Bucket, path: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) throw new InternalServerErrorException(error.message);

    return {
      signedUrl: data.signedUrl,
      storageKey: data.path,
    };
  }

  async createPresignedReadUrl(
    bucket: Bucket,
    storageKey: string,
    expiresIn = 3600,
  ) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(storageKey, expiresIn);

    if (error) throw new InternalServerErrorException(error.message);

    return data.signedUrl;
  }

  async createPresignedReadUrls(
    bucket: Bucket,
    storageKeys: string[],
    expiresIn = 3600,
  ): Promise<Map<string, string>> {
    if (!storageKeys.length) return new Map();

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrls(storageKeys, expiresIn);

    if (error) throw new InternalServerErrorException(error.message);

    return new Map(
      data
        .filter((item) => item.signedUrl && item.path)
        .map((item) => [item.path as string, item.signedUrl]),
    );
  }
}
