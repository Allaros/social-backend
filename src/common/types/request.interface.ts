import { OAuthUser } from '@app/modules/auth/types/Auth.interface';
import { UserEntity } from '@app/modules/user/user.entity';
import { Request } from 'express';

export type GoogleOAuthRequest = Request & {
  user: OAuthUser;
};

export type AuthRequest = Request & {
  user: UserEntity;
};
