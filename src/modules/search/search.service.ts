import { Injectable } from '@nestjs/common';
import { DropdownItem, DropdownSearchResponse } from './types/search.interface';
import { FeedService } from '../feed/services/feed.service';
import { getPostPrimary } from './helpers/post-primary-fallback';
import { PostResponseDto } from '../feed/types/feed.interface';
import { FindProfilesUseCase } from '../profile/use-cases/find-profiles.usecase';

@Injectable()
export class SearchService {
  constructor(
    private readonly findProfilesUseCase: FindProfilesUseCase,
    private readonly feedService: FeedService,
  ) {}
  async dropdownSearch(
    query: string,
    profileId: number,
  ): Promise<DropdownSearchResponse> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery || normalizedQuery.length < 2) {
      return { profiles: [], posts: [] };
    }

    const limit = 4;

    const [profiles, posts] = await Promise.all([
      this.findProfilesUseCase.execute({
        query: normalizedQuery,
        viewerId: profileId,
        limit,
      }),
      this.feedService.searchPosts(profileId, normalizedQuery, { limit }),
    ]);

    const profilesItems: DropdownItem<'profiles'>[] = profiles.data.map(
      (profile) => ({
        id: profile.id,
        primary: profile.name,
        secondary: `@${profile.username}`,
        type: 'profile' as const,
        avatarUrl: profile.avatarUrl,
      }),
    );

    const postsItems: DropdownItem<'posts'>[] = posts.data.map(
      (post: PostResponseDto) => ({
        id: post.id,
        primary: getPostPrimary(post),
        secondary: `@${post.author.username}`,
        type: 'post' as const,
        avatarUrl: post.author.avatarUrl,
      }),
    );

    return {
      profiles: profilesItems,
      posts: postsItems,
    };
  }

  async searchResults(
    query: string,
    type: 'profiles' | 'posts',
    limit: number = 20,
    page: number,
    profileId: number,
  ) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return { data: [], total: 0 };
    }

    if (type === 'profiles') {
      return this.findProfilesUseCase.execute({
        query: normalizedQuery,
        viewerId: profileId,
        limit,
        page,
      });
    }

    if (type === 'posts') {
      return this.feedService.searchPosts(profileId, normalizedQuery, {
        limit,
        page,
      });
    }

    return { data: [], total: 0 };
  }
}
