import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileEntity } from '../profile.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class ProfileQueryService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  buildBaseProfileQuery() {
    return this.profileRepository.createQueryBuilder('profile');
  }

  applySearch(
    qb: SelectQueryBuilder<ProfileEntity>,
    query: string,
    page?: number,
  ) {
    const rawQuery = query.trim();
    const prefixQuery = `${rawQuery}%`;

    const selectFields: string[] = page
      ? [
          'profile.id',
          'profile.name',
          'profile.username',
          'profile.avatarUrl',
          'profile.bio',
        ]
      : ['profile.id', 'profile.name', 'profile.username', 'profile.avatarUrl'];

    qb.select(selectFields)
      .addSelect(
        `
        GREATEST(
          similarity(profile.username, :rawQuery) * 1.5,
          similarity(profile.name, :rawQuery)
        )
      `,
        'similarity_score',
      )
      .addSelect(
        `
        CASE
          WHEN profile.username ILIKE :prefixQuery THEN 1
          ELSE 0
        END
      `,
        'prefix_match',
      )
      .where(
        `
        profile.username ILIKE :prefixQuery
        OR profile.name ILIKE :prefixQuery
        OR profile.username % :rawQuery
        OR profile.name % :rawQuery
      `,
      )
      .orderBy('prefix_match', 'DESC')
      .addOrderBy('similarity_score', 'DESC')
      .addOrderBy('profile.followersCount', 'DESC')

      .setParameters({
        rawQuery,
        prefixQuery,
      });

    qb.addSelect('profile.id', 'profile_id');

    return qb;
  }

  applyProfileState(qb: SelectQueryBuilder<ProfileEntity>, viewerId: number) {
    qb.addSelect(
      `CASE WHEN profile.id = :viewerId THEN true ELSE false END`,
      'is_owner',
    )

      .addSelect(
        `
  EXISTS (
    SELECT 1
    FROM follows f
    WHERE f."followerId" = :viewerId
    AND f."followingId" = profile.id
  )
`,
        'is_followed',
      )

      .addSelect(
        `
  EXISTS (
    SELECT 1
    FROM follows f
    WHERE f."followerId" = profile.id
    AND f."followingId" = :viewerId
  )
`,
        'is_follower',
      )
      .setParameter('viewerId', viewerId);

    return qb;
  }

  async findByUsername(username: string, viewerId: number) {
    const qb = this.buildBaseProfileQuery();

    qb.select([
      'profile.id',
      'profile.name',
      'profile.username',
      'profile.avatarUrl',
      'profile.bio',
      'profile.postsCount',
      'profile.followersCount',
      'profile.followingCount',
    ]);

    qb.where('profile.username = :username', { username });

    this.applyProfileState(qb, viewerId);

    qb.addSelect('profile.id', 'profile_id');

    return qb.getRawAndEntities();
  }
}
