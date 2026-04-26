import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentEntity } from '../entities/comment.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  CommentCursorInternal,
  ReplyCursorInternal,
} from '../types/comments.interface';
import { CursorQueryHelper } from '@app/shared/cursor/helpers/cursor-qb';

@Injectable()
export class PostCommentQueryService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
  ) {}

  private commentSelect = [
    'comment.id',
    'comment.content',
    'comment.createdAt',
    'comment.likesCount',
    'comment.repliesCount',
    'comment.profileId',
    'comment.postId',
    'comment.parentId',
    'comment.replyOnId',
    'comment.replyOnUsername',
    'comment.deletedAt',
    'comment.isEdited',
  ];

  private addIsLiked(qb: SelectQueryBuilder<CommentEntity>, profileId: number) {
    return qb
      .addSelect(
        `
      EXISTS (
        SELECT 1 FROM likes l
        WHERE l."targetId" = comment.id
          AND l."targetType" = 'comment'
          AND l."profileId" = :profileId
      )
      `,
        'isLiked',
      )
      .setParameter('profileId', profileId);
  }

  private createBaseQuery() {
    return this.commentRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.profile', 'profile')
      .select(this.commentSelect)
      .addSelect([
        'profile.id',
        'profile.username',
        'profile.name',
        'profile.avatarUrl',
      ]);
  }

  getDataQuery(params: {
    postId: number;
    profileId: number;
    cursor?: CommentCursorInternal | null;
  }) {
    const { postId, profileId, cursor } = params;

    const qb = this.createBaseQuery()
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.parentId IS NULL');

    this.addIsLiked(qb, profileId);

    CursorQueryHelper.applyCursor(qb, 'comment', cursor ?? null, {
      fields: ['likesCount', 'createdAt', 'id'],
      order: 'DESC',
    });

    qb.orderBy('comment.likesCount', 'DESC')
      .addOrderBy('comment.createdAt', 'DESC')
      .addOrderBy('comment.id', 'DESC');

    return qb;
  }

  getRepliesQuery(params: {
    parentIds: number[];
    profileId: number;
    limitPerParent?: number;
  }) {
    const { parentIds, profileId, limitPerParent = 3 } = params;

    if (!parentIds.length) {
      return {
        getRawAndEntities: () => ({
          entities: [],
          raw: [],
        }),
      };
    }

    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .innerJoin(
        (subQb) =>
          subQb
            .select([
              'c.id AS id',
              'c."parentId" AS "parentId"',
              'ROW_NUMBER() OVER (PARTITION BY c."parentId" ORDER BY c."createdAt" ASC, c.id ASC) as rn',
            ])
            .from(CommentEntity, 'c')
            .where('c."parentId" IN (:...parentIds)', { parentIds }),
        'ranked',
        'ranked.id = comment.id',
      )
      .leftJoin('comment.profile', 'profile')
      .select(this.commentSelect)
      .addSelect([
        'profile.id',
        'profile.username',
        'profile.name',
        'profile.avatarUrl',
      ])
      .where('ranked.rn <= :limitPerParent', { limitPerParent });

    this.addIsLiked(qb, profileId);

    qb.orderBy('comment.parentId', 'ASC')
      .addOrderBy('comment.createdAt', 'ASC')
      .addOrderBy('comment.id', 'ASC');

    return qb;
  }

  getRepliesByParentQuery(params: {
    parentId: number;
    profileId: number;
    cursor?: ReplyCursorInternal | null;
  }) {
    const { parentId, profileId, cursor } = params;

    const qb = this.createBaseQuery().where('comment.parentId = :parentId', {
      parentId,
    });

    this.addIsLiked(qb, profileId);

    CursorQueryHelper.applyCursor(qb, 'comment', cursor ?? null, {
      fields: ['createdAt', 'id'],
      order: 'ASC',
    });

    qb.orderBy('comment.createdAt', 'ASC').addOrderBy('comment.id', 'ASC');

    return qb;
  }
}
