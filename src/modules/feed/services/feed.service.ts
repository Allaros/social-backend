import { PostEntity } from '@app/modules/post/entities/post.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PostIdRow } from '../types/feed.interface';

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
      SELECT 1 FROM post_likes l
      WHERE l."postId" = post.id
        AND l."profileId" = :profileId
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
    cursor?: { createdAt: string; id: number } | null,
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
    cursor: { createdAt: string; id: number } | null,
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
    cursor?: { createdAt: string; id: number } | null,
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
    cursor?: { createdAt: string; id: number } | null,
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
}
