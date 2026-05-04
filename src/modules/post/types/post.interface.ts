export interface CreatePostBody {
  content?: string;
  allowComments: boolean;
  visibility: PostVisibility;
}

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  PRIVATE = 'private',
}

export type PostCounterField =
  | 'likesCount'
  | 'commentsCount'
  | 'savingsCount'
  | 'repostsCount'
  | 'viewsCount';
