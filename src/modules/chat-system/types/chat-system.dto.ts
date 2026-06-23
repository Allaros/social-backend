import { IsNumber } from 'class-validator';

export class AddMemberDto {
  @IsNumber()
  targetProfileId: number;
}

export class KickMemberDto {
  @IsNumber()
  targetProfileId: number;

  restrictedUntil: string | null;
}

export class UnbanMemberDto {
  @IsNumber()
  targetProfileId: number;
}
