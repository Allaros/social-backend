import { IsString, IsInt, IsOptional } from 'class-validator';

export class MessageAttachmentDto {
  @IsString()
  storageKey: string;

  @IsString()
  mimeType: string;

  @IsInt()
  size: number;

  @IsOptional()
  @IsInt()
  width?: number | null;

  @IsOptional()
  @IsInt()
  height?: number | null;

  @IsOptional()
  @IsInt()
  duration?: number | null;
}

export class GetAttachmentUploadUrlDto {
  @IsString()
  mimeType: string;
}
