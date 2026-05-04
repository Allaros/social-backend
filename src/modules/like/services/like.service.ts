import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { LikeEntity } from '../entities/like.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LikeTargetType } from '../types/like.interface';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(LikeEntity)
    private readonly likeRepository: Repository<LikeEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(LikeEntity) : this.likeRepository;
  }

  async create(
    targetId: number,
    profileId: number,
    targetType: LikeTargetType,
    manager?: EntityManager,
  ) {
    const repo = this.getRepo(manager);
    const like = repo.create({
      targetId,
      profileId,
      targetType,
    });

    return await repo.save(like);
  }

  async findByIds(
    targetId: number,
    profileId: number,
    targetType: LikeTargetType,
  ) {
    return this.likeRepository.findOne({
      where: { targetId, profileId, targetType },
    });
  }

  async delete(
    targetId: number,
    targetType: LikeTargetType,
    profileId: number,
    manager?: EntityManager,
  ) {
    const repo = this.getRepo(manager);

    await repo.delete({ targetId, profileId, targetType });
  }

  async deleteByTarget({
    targetId,
    targetType,
  }: {
    targetId: number;
    targetType: LikeTargetType;
  }) {
    return this.likeRepository
      .createQueryBuilder()
      .delete()
      .where('targetId = :targetId', { targetId })
      .andWhere('targetType = :targetType', { targetType })
      .execute();
  }
}
