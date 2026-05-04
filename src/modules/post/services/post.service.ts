import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../entities/post.entity';
import { EntityManager, Repository } from 'typeorm';
import { PostCounterField } from '../types/post.interface';
import { CounterUpdater } from '@app/shared/database/counter-updater';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(PostEntity) : this.postRepository;
  }

  async create(data: Partial<PostEntity>, manager?: EntityManager) {
    return this.getRepo(manager).save(data);
  }

  async update(
    postId: number,
    payload: Partial<PostEntity>,
    manager: EntityManager,
  ) {
    return await manager.update(PostEntity, { id: postId }, { ...payload });
  }

  async findById(postId: number, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(PostEntity)
      : this.postRepository;
    return await repo.findOne({
      where: { id: postId },
      relations: ['media', 'profile'],
    });
  }

  async findByIdWithDeleted(postId: number, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(PostEntity)
      : this.postRepository;
    return await repo.findOne({
      where: { id: postId },
      relations: ['media', 'profile'],
      withDeleted: true,
    });
  }

  async postDelete(post: PostEntity, manager?: EntityManager) {
    await this.getRepo(manager).remove(post);
  }

  async setDeleted(postId: number, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(PostEntity)
      : this.postRepository;
    const result = await repo.softDelete({ id: postId });
    return result;
  }

  async recoverPost(postId: number, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(PostEntity)
      : this.postRepository;
    const result = await repo.restore({ id: postId });

    if (result.affected === 0) {
      throw new NotFoundException('Не удалось восстановить пост');
    }

    return result;
  }

  async updateCounters(
    postId: number,
    updates: Partial<Record<PostCounterField, number>>,
  ) {
    await CounterUpdater.update(this.postRepository, postId, updates);
  }
}
