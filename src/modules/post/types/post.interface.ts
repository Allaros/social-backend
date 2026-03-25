export interface CreatePostBody {
  content?: string;
  allowComments: boolean;
  visibility: 'public' | 'followers' | 'private';
}
