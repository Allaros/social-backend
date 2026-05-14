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

export type ProfileListItem = {
  id: number;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;

  isOwner: boolean;
  isFollowed: boolean;
  isFollower: boolean;
};

export type ProfileRawRow = {
  profile_id: number;
  is_owner: boolean;
  is_followed: boolean;
  is_follower: boolean;
};

export type ProfileCalculatedFields = {
  isOwner?: boolean;
  isFollowed?: boolean;
  isFollower?: boolean;
  isOnline?: boolean;
};

export type ProfileCounterField =
  | 'postsCount'
  | 'followersCount'
  | 'followingCount'
  | 'unreadNotificationsCount'
  | 'unseenNotificationsCount'
  | 'unreadMessagesCount';
