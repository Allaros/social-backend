import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AuthProvider } from '../types/Auth.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: `${configService.get('API_URL')}auth/google/callback`,
      scope: ['openid', 'email', 'profile'],
      passReqToCallback: true,
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    const avatarUrl = profile.photos?.[0]?.value?.replace('=s96-c', '=s256-c');

    return {
      provider: AuthProvider.GOOGLE,
      providerId: profile.id,
      email,

      profile: {
        name:
          profile.displayName ||
          `${profile.name?.givenName ?? ''} ${profile.name?.familyName ?? ''}`.trim(),
        avatarUrl,
      },

      isVerified: true,
    };
  }
}
