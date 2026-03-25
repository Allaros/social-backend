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
