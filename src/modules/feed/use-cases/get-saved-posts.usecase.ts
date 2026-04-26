import { Injectable } from '@nestjs/common';
import { FeedService } from '../services/feed.service';
import { buildPostResponse } from '../builders/build-feed-responce';
import { normalizeRaw } from '../mappers/raw-mapper';
import { decodeCursor } from '../helpers/decode-cursor';
import { encodeCursor } from '../helpers/encode-cursor';

@Injectable()
export class GetSavedPostsUseCase {
  constructor(private readonly feedService: FeedService) {}

  async execute(profileId: number, limit?: number, cursorString?: string) {
    const normalizedLimit = Math.min(limit ?? 5, 10);

    const cursor = decodeCursor(cursorString);

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
        ? encodeCursor({
            createdAt: nextCursor.createdAt.toISOString(),
            id: nextCursor.id,
          })
        : null,
    };
  }
}
