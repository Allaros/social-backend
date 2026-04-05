import { PostEntity } from '@app/modules/post/entities/post.entity';
import { PostResponseDto, RawFlags } from '../types/feed.interface';

export function buildPostResponse(
  posts: PostEntity[],
  rawMap: Map<number, RawFlags>,
): PostResponseDto[] {
  return posts.map((post) => {
    const flags = rawMap.get(post.id);

    return {
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      allowComments: post.allowComments,
      visibility: post.visibility,

      author: post.profile && {
        id: post.profile.id,
        username: post.profile.username,
        name: post.profile.name,
        avatarUrl: post.profile.avatarUrl,
      },

      media:
        post.media?.map((m) => ({
          id: m.id,
          url: m.url,
          type: m.type,
        })) ?? [],

      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      repostsCount: post.repostsCount,
      viewsCount: post.viewsCount,

      isLiked: flags?.isLiked ?? false,
      isSaved: flags?.isSaved ?? false,
      isOwned: flags?.isOwned ?? false,
    };
  });
}
