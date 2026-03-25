import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  content?: string;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  allowComments: boolean;

  @IsEnum(['public', 'followers', 'private'])
  visibility: 'public' | 'followers' | 'private';
}
