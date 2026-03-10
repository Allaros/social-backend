export interface CreateProfileInput {
  name?: string;
  username?: string;
  avatarUrl?: string;
}

export interface ProfileResponce {
  name: string;
  nickname?: string;
  followingCount: number;
  postsCount: number;
  followersCount: number;
  avatarUrl?: string;
  bio?: string;
  slug: string;
}
