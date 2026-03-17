export interface CreateProfileInput {
  name?: string;
  username?: string;
  avatarUrl?: string;
}

export interface ProfileResponce {
  name: string;
  username?: string;
  followingCount: number;
  postsCount: number;
  followersCount: number;
  avatarUrl?: string;
  bio?: string;
}
