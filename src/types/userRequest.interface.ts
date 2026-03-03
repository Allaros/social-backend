import { AuthProvider } from '@app/auth/types/Auth.interface';
import { UserEntity } from '@app/user/user.entity';
import { Request } from 'express';

export type UserRequest = Request & {
  user?: UserEntity;
};

export type GoogleOAuthRequest = Request & {
  user: {
    provider: AuthProvider;
    providerId: string;
    email: string;
  };
};
