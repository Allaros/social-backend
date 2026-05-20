import { IsString, IsInt } from 'class-validator';

export class MessageAttachmentDto {
  @IsString()
  storageKey: string;

  @IsString()
  mimeType: string;

  @IsInt()
  size: number;
}

export class GetAttachmentUploadUrlDto {
  @IsString()
  mimeType: string;
}
