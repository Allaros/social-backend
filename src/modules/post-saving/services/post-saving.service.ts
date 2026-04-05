import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SavedPostEntity } from '../entities/saved_posts.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class PostSavingService {
  constructor(
    @InjectRepository(SavedPostEntity)
    private readonly postSavingRepository: Repository<SavedPostEntity>,
  ) {}

  async create(postId: number, profileId: number, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(SavedPostEntity)
      : this.postSavingRepository;

    const saving = repo.create({
      profile: { id: profileId },
      post: { id: postId },
    });

    return await repo.save(saving);
  }

  async delete(postId: number, profileId: number, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(SavedPostEntity)
      : this.postSavingRepository;

    await repo.delete({
      profile: { id: profileId },
      post: { id: postId },
    });
  }

  async findExisting(
    postId: number,
    profileId: number,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(SavedPostEntity)
      : this.postSavingRepository;

    return await repo.findOne({
      where: { post: { id: postId }, profile: { id: profileId } },
    });
  }
}
