import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  InternalServerErrorException,
  Param,
  ParseEnumPipe,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ChangePasswordDto,
  EmailDto,
  SignInUserDto,
  SignUpUserDto,
  VerifyDto,
} from './types/Auth.dto';
import { AuthService } from './auth.service';
import { UserService } from '@app/modules/user/user.service';
import { UserResponse } from '@app/modules/user/types/User.interface';
import { Response, Request } from 'express';
import { VerificationService } from '@app/modules/verification/verification.service';
import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { UserEntity } from '@app/modules/user/user.entity';
import {
  AuthRequest,
  GoogleOAuthRequest,
} from '@app/shared/types/request.interface';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ConfigService } from '@nestjs/config';
import { VerificationType } from '../verification/types/verification.interface';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
    private readonly configService: ConfigService,
  ) {}

  private setCookieOptions(maxAgeMinutes: number) {
    return {
      httpOnly: true,
      maxAge: maxAgeMinutes * 60 * 1000,
      sameSite: this.configService.get<'lax' | 'none' | 'strict'>(
        'COOKIE_SAME_SITE',
      ),
      secure: this.configService.get<string>('COOKIE_SECURE') === 'true',
    };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('sign-up')
  @UsePipes(new ValidationPipe())
  async signUp(
    @Body() signUpUserDto: SignUpUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponse> {
    const { user, accessToken, refreshToken } =
      await this.authService.registerWithPassword(signUpUserDto, req);

    const verificationToken =
      await this.verificationService.createNewVerification(
        VerificationType.EMAIL,
        user,
      );

    res.cookie(
      'verificationToken',
      verificationToken,
      this.setCookieOptions(15),
    );
    res.cookie('accessToken', accessToken, this.setCookieOptions(20));
    res.cookie(
      'refreshToken',
      refreshToken,
      this.setCookieOptions(7 * 24 * 60),
    );

    return this.userService.buildUserResponse(user);
  }

  @Put('verify')
  async verifyUser(
    @Body() data: VerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const verificationToken = req.cookies['verificationToken'] as string;

    if (!verificationToken)
      throw new ForbiddenException(
        'Время верификации истекло, или она недействительна. Пожалуйста, повторите попытку',
      );

    const verification = await this.verificationService.verifyVerification(
      verificationToken,
      VerificationType.EMAIL,
      data.code,
    );

    if (!verification.user)
      throw new ForbiddenException('Пользователь не найден');

    await this.userService.verifyUser(verification.user);

    res.clearCookie('verificationToken');

    return this.userService.buildUserResponse(verification.user);
  }

  @Post('send/:sendType')
  async resendVerificationCode(
    @Param('sendType', new ParseEnumPipe(VerificationType))
    sendType: VerificationType,
    @Body() dto: EmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'] as string;

    let user: UserEntity | null = null;

    if (dto.email) {
      user = await this.userService.findByEmail(dto.email);
    } else if (refreshToken) {
      user = await this.userService.findBySession(refreshToken);
    } else {
      throw new ForbiddenException(
        'Сессия недействительна, повторите регистрацию',
      );
    }

    if (!user) return { success: true };

    const verificationToken =
      await this.verificationService.createNewVerification(sendType, user);

    res.cookie(
      'verificationToken',
      verificationToken,
      this.setCookieOptions(15),
    );

    return { success: true };
  }

  @Post('magic')
  @UsePipes(new ValidationPipe())
  async requestMagic(@Body() dto: EmailDto) {
    await this.verificationService.createNewVerification(
      VerificationType.MAGIC_LINK,
      undefined,
      dto.email,
    );

    return { success: true };
  }

  @Post('magic/confirm')
  @UsePipes(new ValidationPipe())
  async confirmMagic(
    @Body() dto: { token: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.loginWithMagicLink(dto.token, req);

    res.cookie('accessToken', accessToken, this.setCookieOptions(20));
    res.cookie(
      'refreshToken',
      refreshToken,
      this.setCookieOptions(7 * 24 * 60),
    );

    return this.userService.buildUserResponse(user);
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
    const { accessToken, refreshToken } =
      await this.authService.registerWithGoogle(req.user, req);

    res.cookie('accessToken', accessToken, this.setCookieOptions(20));
    res.cookie(
      'refreshToken',
      refreshToken,
      this.setCookieOptions(7 * 24 * 60),
    );

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl)
      throw new InternalServerErrorException('Frontend url не указан');

    return res.redirect(frontendUrl);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(200)
  @Post('sign-in')
  async authUser(
    @Body() signInData: SignInUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponse> {
    const { user, refreshToken, accessToken, verificationToken } =
      await this.authService.authorizeUser(signInData, req);

    res.cookie('accessToken', accessToken, this.setCookieOptions(20));
    res.cookie(
      'refreshToken',
      refreshToken,
      this.setCookieOptions(7 * 24 * 60),
    );

    if (verificationToken) {
      res.cookie(
        'verificationToken',
        verificationToken,
        this.setCookieOptions(15),
      );

      throw new UnauthorizedException({
        code: 'EMAIL_IS_NOT_VERIFIED',
        message: 'Email не верифицирован',
      });
    }

    return this.userService.buildUserResponse(user);
  }

  @Post('change-password')
  @UsePipes(new ValidationPipe())
  async changePassword(@Body() dto: ChangePasswordDto) {
    await this.authService.changeUserPassword(dto);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(200)
  @Post('refresh')
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies['refreshToken'] as string;
    if (!token) throw new UnauthorizedException();

    const { accessToken, refreshToken } = await this.authService.refresh(
      token,
      req,
    );

    res.cookie('accessToken', accessToken, this.setCookieOptions(20));
    res.cookie(
      'refreshToken',
      refreshToken,
      this.setCookieOptions(7 * 24 * 60),
    );
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getUser(@CurrentUser() user: UserEntity) {
    return this.userService.buildUserResponse(user);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'] as string;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { success: true };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(req.user.id);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { success: true };
  }
}
