import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignUpUserDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  readonly password: string;

  @IsNotEmpty()
  @MaxLength(50)
  readonly name: string;

  @IsOptional()
  @MaxLength(30)
  readonly username?: string;
}

export class SignInUserDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  readonly password: string;
}

export class EmailDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;
}

export class VerifyDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(60)
  password: string;

  @IsNotEmpty()
  token: string;
}
