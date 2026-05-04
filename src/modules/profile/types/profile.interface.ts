export interface CreateProfileInput {
  name?: string;
  username?: string;
  avatarUrl?: string;
}

export interface ProfileResponce {
  id: number;
  name: string;
  username?: string;
  followingCount: number;
  postsCount: number;
  followersCount: number;
  avatarUrl?: string;
  bio?: string;
}

export type ProfileCounterField =
  | 'postsCount'
  | 'followersCount'
  | 'followingCount';
