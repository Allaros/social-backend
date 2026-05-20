import { TableTypes } from '@app/database.types';

export interface DiskMulterFile extends Express.Multer.File {
  filename: string;
}

export type Database = {
  public: TableTypes;
};

export interface UploadedMedia {
  url: string;
  type: 'image' | 'video' | 'file';
  size: number;
  previewUrl?: string;
}

export enum BucketName {
  POST_MEDIA = 'post-media',
  AVATARS = 'avatars',
  CHAT_AVATARS = 'chat-avatars',
  MESSAGE_ATTACHMENTS = 'message-attachments',
}

export type Bucket = `${BucketName}`;

export type Format = 'webp' | 'mp4';
