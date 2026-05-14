export type CommentCursor = {
  likesCount: number;
  createdAt: number;
  id: number;
};

export type CommentCounterField = 'likesCount' | 'repliesCount';

export type CommentCursorInternal = {
  likesCount: number;
  createdAt: Date;
  id: number;
};

export type ReplyCursor = {
  createdAt: number;
  id: number;
};

export type ReplyCursorInternal = {
  createdAt: Date;
  id: number;
};

export interface CommentResponse {
  id: number;
  parentId?: number | null;
  content: string | null;
  createdAt: Date;
  likesCount: number;
  repliesCount: number;
  isDeleted: boolean;
  isLiked: boolean;

  author: {
    id: number;
    username: string;
    name: string;
    avatarUrl?: string;
  };
}
