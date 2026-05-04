import { IsNumber } from 'class-validator';

export class CreateFollowDto {
  @IsNumber()
  followingId: number;
}

export class DeleteFollowDto {
  @IsNumber()
  followingId: number;
}
