import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../entities/post.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  async create(data: Partial<PostEntity>, manager: EntityManager) {
    return manager.save(PostEntity, data);
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

  async postDelete(post: PostEntity, manager: EntityManager) {
    await manager.remove(post);
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
}
