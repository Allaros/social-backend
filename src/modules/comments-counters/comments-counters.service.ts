import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CommentEntity } from '../post-comments/entities/comment.entity';
import { CommentCounterField } from './types/comments-counters.interface';

@Injectable()
export class CommentsCountersService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
  ) {}

  private getRepository(manager?: EntityManager) {
    return manager
      ? manager.getRepository(CommentEntity)
      : this.commentRepository;
  }

  async updateCounters(
    commentId: number,
    updates: Partial<Record<CommentCounterField, number>>,
    manager?: EntityManager,
  ) {
    const repo = this.getRepository(manager);
    const operations: Promise<any>[] = [];

    for (const [field, value] of Object.entries(updates)) {
      if (!value) continue;

      if (value > 0) {
        operations.push(
          repo.increment(
            { id: commentId },
            field as CommentCounterField,
            value,
          ),
        );
      } else {
        operations.push(
          repo.decrement(
            { id: commentId },
            field as CommentCounterField,
            Math.abs(value),
          ),
        );
      }
    }

    await Promise.all(operations);
  }
}
