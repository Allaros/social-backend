import { Injectable } from '@nestjs/common';
import { FeedService } from '../services/feed.service';
import { buildPostResponse } from '../builders/build-feed-responce';
import { normalizeRaw } from '../mappers/raw-mapper';
import { feedCursorCodec } from '../helpers/cursor-codec';

@Injectable()
export class GetSavedPostsUseCase {
  constructor(private readonly feedService: FeedService) {}

  async execute(profileId: number, limit?: number, cursorString?: string) {
    const normalizedLimit = Math.min(limit ?? 5, 10);

    const cursor = feedCursorCodec.decode(cursorString);

    const { entities, raw, nextCursor } = await this.feedService.getSavedPosts(
      profileId,
      normalizedLimit,
      cursor,
    );

    const rawMap = normalizeRaw(raw);
    const posts = buildPostResponse(entities, rawMap);

    return {
      posts,
      nextCursor: nextCursor
        ? feedCursorCodec.encode({
            createdAt: nextCursor.createdAt.getTime(),
            id: nextCursor.id,
          })
        : null,
    };
  }
}
