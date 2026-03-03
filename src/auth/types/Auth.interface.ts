export enum AuthProvider {
  GOOGLE = 'google',
  PASSWORD = 'password',
  GITHUB = 'github',
  MAGIC = 'magic',
}

export interface GoogleOAuthUser {
  provider: AuthProvider;
  providerId: string;
  email: string;
}
