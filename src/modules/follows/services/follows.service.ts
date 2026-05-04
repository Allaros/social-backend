import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FollowsEntity } from '../entities/follows.entity';
import { FollowStatus } from '../types/follows.interface';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(FollowsEntity)
    private readonly followsRepository: Repository<FollowsEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager
      ? manager.getRepository(FollowsEntity)
      : this.followsRepository;
  }

  async create(
    followerId: number,
    followingId: number,
    manager?: EntityManager,
  ) {
    const repo = this.getRepo(manager);

    return await repo.insert({
      followerId,
      followingId,
      status: FollowStatus.ACTIVE,
    });
  }

  async findRelation(
    followerId: number,
    followingId: number,
    manager?: EntityManager,
  ) {
    const repo = this.getRepo(manager);

    return await repo.findOne({ where: { followerId, followingId } });
  }

  async delete(
    followerId: number,
    followingId: number,
    manager?: EntityManager,
  ) {
    await this.getRepo(manager).delete({ followerId, followingId });
  }
}
