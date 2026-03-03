import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class SendRecoveryMailDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @MaxLength(100)
  @MinLength(6)
  readonly password: string;

  @IsNotEmpty()
  readonly token: string;
}
