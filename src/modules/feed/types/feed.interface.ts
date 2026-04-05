export interface PostResponseDto {
  id: number;
  content: string;
  createdAt: Date;

  author: {
    id: number;
    username: string;
    name: string;
    avatarUrl?: string;
  };

  media: {
    url: string;
    type: string;
  }[];

  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;

  isLiked: boolean;
  isSaved: boolean;
  isOwned: boolean;
}

export type RawFlags = {
  isLiked: boolean;
  isSaved: boolean;
  isOwned: boolean;
};

export type Cursor = {
  createdAt: string;
  id: number;
};

export type PostIdRow = {
  post_id: number;
  post_createdAt: Date;
};
