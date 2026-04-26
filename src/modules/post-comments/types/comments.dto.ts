import {
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  body: string;

  @IsNumber()
  postId: number;

  @ValidateIf(
    (o: CreateCommentDto) => o.replyOnId !== undefined && o.replyOnId !== null,
  )
  @IsNumber()
  parentId?: number;

  @ValidateIf(
    (o: CreateCommentDto) => o.parentId !== undefined && o.parentId !== null,
  )
  @IsNumber()
  replyOnId?: number;
}

export class EditCommentDto {
  @IsNumber()
  postId: number;

  @IsString()
  body: string;
}

export class GetCommentsQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
