import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  IsNumber,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import { MessageAttachmentDto } from './messages-attachment.dto';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentDto)
  attachments?: MessageAttachmentDto[];

  @IsOptional()
  @IsNumber()
  replyToMessageId?: number;
}

export class GetMessagesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  query?: string;
}
