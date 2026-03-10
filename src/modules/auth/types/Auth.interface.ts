export enum AuthProvider {
  GOOGLE = 'google',
  PASSWORD = 'password',
  MAGIC = 'magic',
}

export interface OAuthUser {
  email: string;
  provider: AuthProvider;
  providerId: string;
  profile?: {
    name?: string;
    username?: string;
    avatarUrl?: string;
  };
  isVerified?: boolean;
}
