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
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { MessageAttachmentDto } from './messages-attachment.dto';
import { ForwardPayload } from './messages.interface';

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

  @IsOptional()
  @IsString()
  clientId?: string;
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

export class MessagesActionDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  messageIds: number[];
}

export class EditMessageDto {
  @IsString()
  @MaxLength(4000)
  text: string;
}

export class ForwardMessagesDto {
  @IsArray()
  @ArrayNotEmpty()
  forwardPayload: ForwardPayload[];
}
