import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Put,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SignInUserDto, SignUpUserDto, VerifyDto } from './types/Auth.dto';
import { AuthService } from './auth.service';
import { UserService } from '@app/user/user.service';
import { UserResponse } from '@app/user/types/User.interface';
import { Response, Request } from 'express';
import { VerificationService } from '@app/verification/verification.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
  ) {}

  @Post('sign-in')
  async authUser(@Body() signInData: SignInUserDto): Promise<UserResponse> {
    const user = await this.authService.authorizeUser(signInData);
    return this.userService.buildUserResponse(user);
  }

  @Post('sign-up')
  @UsePipes(new ValidationPipe())
  async signUp(
    @Body() signUpUserDto: SignUpUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponse> {
    const { user, tempToken, recoveryToken } =
      await this.authService.registerUser(signUpUserDto);

    res.cookie('verificationTempToken', tempToken, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    });
    res.cookie('verificationRecoveryToken', recoveryToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return this.userService.buildUserResponse(user);
  }

  @Put('verify')
  async verifyUser(
    @Body() data: VerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tempToken = req.cookies['verificationTempToken'] as string;

    if (!tempToken) throw new ForbiddenException('Нет доступа');

    const verifiedUser = await this.verificationService.verifyCode(
      data.code,
      tempToken,
    );

    res.clearCookie('verificationTempToken');

    return this.userService.buildUserResponse(verifiedUser);
  }

  @Post('resend')
  async resendVerificationCode(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const recoveryToken = req.cookies['verificationRecoveryToken'] as string;
    if (!recoveryToken) throw new ForbiddenException('Нет доступа');

    const verification =
      await this.verificationService.findByRecoveryToken(recoveryToken);
    if (!verification) throw new ForbiddenException('Нет доступа');

    const user = verification.user;

    const newTempToken = await this.verificationService.resendVerificationCode(
      user,
      recoveryToken,
    );

    res.cookie('verificationTempToken', newTempToken, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    });

    return { message: 'Новый код отправлен' };
  }
}
