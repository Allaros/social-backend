import { PostEntity } from '@app/modules/post/entities/post.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  FeedCursor,
  PostIdRow,
  PostResponseDto,
} from '../types/feed.interface';
import { SearchResult } from '@app/modules/search/types/search.interface';
import { buildPostResponse } from '../builders/build-feed-responce';
import { normalizeRaw } from '../mappers/raw-mapper';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  private buildIdsQuery(
    profileId: number,
    options?: { includePrivate?: boolean },
  ) {
    const { includePrivate = false } = options ?? {};

    const qb = this.postRepository
      .createQueryBuilder('post')
      .select(['post.id', 'post.createdAt'])
      .where('post.deletedAt IS NULL');

    this.applyVisibilityFilter(qb, profileId, includePrivate);

    return qb;
  }

  private buildDataQuery(profileId: number) {
    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.profile', 'profile')
      .leftJoin('post.media', 'media')
      .select([
        'post.id',
        'post.content',
        'post.allowComments',
        'post.visibility',
        'post.createdAt',
        'post.isEdited',
        'post.likesCount',
        'post.commentsCount',
        'post.repostsCount',
        'post.viewsCount',
        'post.profileId',
      ])
      .addSelect([
        'profile.id',
        'profile.username',
        'profile.name',
        'profile.avatarUrl',
      ])
      .addSelect(['media.id', 'media.url', 'media.type', 'media.postId']);

    qb.addSelect(
      `CASE WHEN post."profileId" = :profileId THEN true ELSE false END`,
      'isOwned',
    );

    qb.addSelect(
      `EXISTS (
    SELECT 1 FROM likes l
    WHERE l."targetId" = post.id
      AND l."profileId" = :profileId
      AND l."targetType" = 'post'
  )`,
      'isLiked',
    );

    qb.addSelect(
      `EXISTS (
      SELECT 1 FROM saved_posts s
      WHERE s."postId" = post.id
        AND s."profileId" = :profileId
    )`,
      'isSaved',
    );

    qb.setParameters({ profileId });

    return qb;
  }

  private async getFeedBase(
    idsQb: SelectQueryBuilder<PostEntity>,
    profileId: number,
    limit: number,
    cursor?: FeedCursor | null,
  ) {
    if (cursor) {
      idsQb.andWhere(
        `(
      post."createdAt" < :createdAt
      OR (post."createdAt" = :createdAt AND post.id < :id)
    )`,
        {
          createdAt: new Date(cursor.createdAt),
          id: cursor.id,
        },
      );
    }

    idsQb
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('post.id', 'DESC')
      .limit(limit + 1);

    const idsResult = await idsQb.getRawMany<PostIdRow>();

    if (!idsResult.length) {
      return {
        entities: [],
        raw: [],
        nextCursor: null,
      };
    }

    const hasNextPage = idsResult.length > limit;

    const sliced = hasNextPage ? idsResult.slice(0, limit) : idsResult;

    const ids = sliced.map((r) => r.post_id);

    const lastItem = sliced[sliced.length - 1];

    const nextCursor = hasNextPage
      ? {
          createdAt: lastItem.post_createdAt,
          id: lastItem.post_id,
        }
      : null;

    const dataQb = this.buildDataQuery(profileId).where(
      'post.id IN (:...ids)',
      { ids },
    );

    const result = await dataQb.getRawAndEntities();

    const orderMap = new Map(ids.map((id, i) => [id, i]));

    result.entities.sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);

    return {
      ...result,
      nextCursor,
    };
  }

  private applyVisibilityFilter(
    qb: SelectQueryBuilder<PostEntity>,
    profileId: number,
    includePrivate: boolean,
  ) {
    if (includePrivate) {
      qb.andWhere(
        `(post.visibility = 'public' OR post.profileId = :profileId)`,
        { profileId },
      );
    } else {
      qb.andWhere(`post.visibility = 'public'`);
    }
  }

  async getFeed(
    limit: number = 10,
    cursor: FeedCursor | null,
    profileId: number,
  ) {
    const idsQb = this.buildIdsQuery(profileId, {
      includePrivate: false,
    });

    return this.getFeedBase(idsQb, profileId, limit, cursor);
  }

  async getUserPosts(
    currentProfileId: number,
    targetProfileId: number,
    limit: number = 5,
    cursor?: FeedCursor | null,
  ) {
    const isOwner = currentProfileId === targetProfileId;

    const idsQb = this.buildIdsQuery(currentProfileId, {
      includePrivate: isOwner,
    });

    idsQb.andWhere('post.profileId = :targetProfileId', {
      targetProfileId,
    });

    return this.getFeedBase(idsQb, currentProfileId, limit, cursor);
  }

  async getSavedPosts(
    profileId: number,
    limit: number = 5,
    cursor?: FeedCursor | null,
  ) {
    const idsQb = this.buildIdsQuery(profileId, {
      includePrivate: true,
    });

    idsQb.innerJoin(
      'saved_posts',
      'saved',
      'saved.postId = post.id AND saved.profileId = :profileId',
      { profileId },
    );

    return this.getFeedBase(idsQb, profileId, limit, cursor);
  }

  //=============================================== Search Posts ==========================================================

  private buildSearchIdsQuery(
    profileId: number,
    query: string,
    options?: { includePrivate?: boolean },
  ) {
    const { includePrivate = false } = options ?? {};

    const normalizedQuery = query.trim();

    const params = {
      query: normalizedQuery,
      prefix: `${normalizedQuery}%`,
      fallback: `%${normalizedQuery}%`,
    };

    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.profile', 'profile')
      .select(['post.id AS post_id', 'post.createdAt'])

      .addSelect(
        `
      CASE
        WHEN profile.name ILIKE :prefix THEN 2
        WHEN post.content ILIKE :prefix THEN 1
        ELSE 0
      END
      `,
        'prefix_match',
      )

      .addSelect(
        `
      GREATEST(
        similarity(post.content, :query),
        similarity(profile.name, :query) * 1.3,
        similarity(profile.username, :query) * 1.1
      )
      `,
        'similarity_score',
      )

      .addSelect(
        `
      (
        GREATEST(
          similarity(post.content, :query),
          similarity(profile.name, :query) * 1.3,
          similarity(profile.username, :query) * 1.1
        ) * 0.6 +
        LOG(1 + post."likesCount") * 0.3 +
        CASE 
          WHEN post."createdAt" > NOW() - INTERVAL '3 days' THEN 0.1
          ELSE 0
        END
      )
      `,
        'rank_score',
      )

      .where('post.deletedAt IS NULL')

      .andWhere(
        `
      (
        post.content ILIKE :prefix
        OR post.content ILIKE :fallback
        OR post.content % :query

        OR profile.name ILIKE :prefix
        OR profile.name ILIKE :fallback
        OR profile.name % :query

        OR profile.username ILIKE :prefix
      )
      `,
      )

      .andWhere(
        `
      GREATEST(
        similarity(post.content, :query),
        similarity(profile.name, :query)
      ) > 0.2
      `,
      )

      .setParameters(params);

    this.applyVisibilityFilter(qb, profileId, includePrivate);

    return qb;
  }

  private async getSearchBase(
    idsQb: SelectQueryBuilder<PostEntity>,
    profileId: number,
    limit: number,
    offset: number,
  ) {
    idsQb
      .orderBy('prefix_match', 'DESC')
      .addOrderBy('rank_score', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .limit(limit)
      .offset(offset);

    const idsResult = await idsQb.getRawMany<{ post_id: number }>();

    if (!idsResult.length) {
      return {
        entities: [],
        raw: [],
      };
    }

    const ids = idsResult.map((r) => r.post_id);

    const dataQb = this.buildDataQuery(profileId).where(
      'post.id IN (:...ids)',
      { ids },
    );

    const result = await dataQb.getRawAndEntities();

    const orderMap = new Map<number, number>(
      ids.map((id, index) => [id, index]),
    );

    result.entities.sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
    );

    return {
      entities: result.entities,
      raw: idsResult,
    };
  }

  async searchPosts(
    profileId: number,
    query: string,
    options?: {
      limit?: number;
      page?: number;
    },
  ): Promise<SearchResult<PostResponseDto>> {
    const { limit = 10, page = 1 } = options || {};
    const offset = (page - 1) * limit;

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit,
        },
      };
    }

    const idsQb = this.buildSearchIdsQuery(profileId, normalizedQuery, {
      includePrivate: true,
    });

    const data = await this.getSearchBase(idsQb, profileId, limit, offset);

    const rawMap = normalizeRaw(data.raw);

    const posts = buildPostResponse(data.entities, rawMap);

    const countParams = {
      query: normalizedQuery,
      prefix: `${normalizedQuery}%`,
      fallback: `%${normalizedQuery}%`,
    };

    const totalQb = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.profile', 'profile')
      .where('post.deletedAt IS NULL')
      .andWhere(
        `
      (
        post.content ILIKE :prefix
        OR post.content ILIKE :fallback
        OR post.content % :query

        OR profile.name ILIKE :prefix
        OR profile.name ILIKE :fallback
        OR profile.name % :query

        OR profile.username ILIKE :prefix
      )
    `,
      )
      .andWhere(
        `
      GREATEST(
        similarity(post.content, :query),
        similarity(profile.name, :query)
      ) > 0.2
    `,
      )
      .setParameters(countParams);

    this.applyVisibilityFilter(totalQb, profileId, true);

    const total = await totalQb.getCount();

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
      },
    };
  }
}
