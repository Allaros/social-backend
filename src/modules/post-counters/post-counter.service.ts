import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PostCounterField } from './types/post-counter.interface';
import { PostEntity } from '../post/entities/post.entity';

@Injectable()
export class PostCounterService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  private getRepository(manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(PostEntity)
      : this.postRepository;

    return repo;
  }

  async updateCounters(
    postId: number,
    updates: Partial<Record<PostCounterField, number>>,
    manager?: EntityManager,
  ) {
    const repo = this.getRepository(manager);
    const operations: Promise<any>[] = [];
    for (const [field, value] of Object.entries(updates)) {
      if (!value) continue;

      if (value > 0) {
        operations.push(
          repo.increment({ id: postId }, field as PostCounterField, value),
        );
      } else {
        operations.push(
          repo.decrement(
            { id: postId },
            field as PostCounterField,
            Math.abs(value),
          ),
        );
      }
    }

    await Promise.all(operations);
  }
}
