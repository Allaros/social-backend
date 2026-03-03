import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SignInUserDto, SignUpUserDto, VerifyDto } from './types/Auth.dto';
import { AuthService } from './auth.service';
import { UserService } from '@app/user/user.service';
import { UserResponse } from '@app/user/types/User.interface';
import { Response, Request } from 'express';
import { VerificationService } from '@app/verification/verification.service';
import { JwtAuthGuard } from '@app/guards/auth.guard';
import { CurrentUser } from '@app/user/decorators/currentUser.decorator';
import { UserEntity } from '@app/user/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getUser(@CurrentUser() user: UserEntity) {
    return this.userService.buildUserResponse(user);
  }

  @Post('refresh')
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'] as string;
    if (!refreshToken) throw new UnauthorizedException();

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshAccessToken(refreshToken);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { success: true };
  }

  @Post('sign-in')
  async authUser(
    @Body() signInData: SignInUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponse> {
    const { user, refreshToken, accessToken } =
      await this.authService.authorizeUser(signInData);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return this.userService.buildUserResponse(user);
  }

  @Post('sign-up')
  @UsePipes(new ValidationPipe())
  async signUp(
    @Body() signUpUserDto: SignUpUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponse> {
    const { user, tempToken, recoveryToken, accessToken, refreshToken } =
      await this.authService.registerUser(signUpUserDto);

    res.cookie('verificationTempToken', tempToken, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    });
    res.cookie('verificationRecoveryToken', recoveryToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
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
    res.clearCookie('verificationRecoveryToken');

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
