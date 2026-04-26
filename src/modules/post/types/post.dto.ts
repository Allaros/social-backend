import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PostVisibility } from './post.interface';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  allowComments: boolean;

  @IsEnum(PostVisibility)
  visibility: PostVisibility;
}

export class EditPostDto {
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  allowComments: boolean;

  @IsEnum(PostVisibility)
  visibility: PostVisibility;

  @IsOptional()
  @IsArray()
  @Transform(({ value }: { value: string }) => {
    if (!value) return [];

    try {
      const parsed: unknown = JSON.parse(value);

      if (isNumberArray(parsed)) {
        return parsed;
      }

      return [];
    } catch {
      return [];
    }
  })
  keepMediaIds?: number[];
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'number');
}
