import { Injectable } from '@nestjs/common';
import { FeedService } from '../services/feed.service';
import { normalizeRaw } from '../mappers/raw-mapper';
import { buildPostResponse } from '../builders/build-feed-responce';
import { feedCursorCodec } from '../helpers/cursor-codec';

@Injectable()
export class GetFeedUseCase {
  constructor(private readonly feedService: FeedService) {}

  async execute(profileId: number, limit?: number, cursorString?: string) {
    const normalizedLimit = Math.min(limit ?? 10, 50);

    const cursor = feedCursorCodec.decode(cursorString);

    const { entities, raw, nextCursor } = await this.feedService.getFeed(
      normalizedLimit,
      cursor,
      profileId,
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
