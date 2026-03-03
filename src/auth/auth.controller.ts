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
import { GoogleOAuthRequest } from '@app/types/userRequest.interface';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
    private readonly configServise: ConfigService,
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
      await this.authService.refreshAccessToken(refreshToken, req);

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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponse> {
    const { user, refreshToken, accessToken } =
      await this.authService.authorizeUser(signInData, req);

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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponse> {
    const { user, tempToken, recoveryToken, accessToken, refreshToken } =
      await this.authService.registerUser(signUpUserDto, req);

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

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logoutCurrent(
    @CurrentUser() user: UserEntity,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutCurrent(user.id, req);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { success: true };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.id);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { success: true };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleOAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: GoogleOAuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.oauthLogin(req.user, req);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(this.configServise.get<string>('FRONTEND_URL')!);
  }
}
