import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Bucket, Database } from '../types/file.interface';
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
}
