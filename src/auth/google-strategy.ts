import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configServise: ConfigService) {
    super({
      clientID: configServise.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configServise.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: `${configServise.get('API_URL')}auth/google/callback`,
      scope: ['openid', 'email', 'profile'],
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    return {
      provider: 'google',
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
    };
  }
}
