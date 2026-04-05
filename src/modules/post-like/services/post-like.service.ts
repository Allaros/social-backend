import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { LikesEntity } from '../entities/like.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PostLikeService {
  constructor(
    @InjectRepository(LikesEntity)
    private readonly likeRepository: Repository<LikesEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(LikesEntity) : this.likeRepository;
  }

  async create(postId: number, profileId: number, manager?: EntityManager) {
    const repo = this.getRepo(manager);
    const like = repo.create({
      postId,
      profileId,
    });

    return await repo.save(like);
  }

  async findByIds(postId: number, profileId: number) {
    return this.likeRepository.findOne({ where: { postId, profileId } });
  }

  async delete(postId: number, profileId: number, manager?: EntityManager) {
    const repo = this.getRepo(manager);

    await repo.delete({ postId, profileId });
  }
}
