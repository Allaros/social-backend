import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentEntity } from '../entities/comment.entity';
import { EntityManager, IsNull, Repository } from 'typeorm';

@Injectable()
export class PostCommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager
      ? manager.getRepository(CommentEntity)
      : this.commentRepository;
  }

  async findById(commentId: number, postId?: number, manager?: EntityManager) {
    const where: { id: number; postId?: number } = { id: commentId };
    if (postId !== undefined) {
      where.postId = postId;
    }
    const comment = await this.getRepo(manager).findOne({
      where,
      relations: ['profile'],
    });
    return comment;
  }

  async create(
    body: string,
    profileId: number,
    postId: number,
    parentId?: number | null,
    replyOnId?: number | null,
    replyOnUsername?: string | null,
    manager?: EntityManager,
  ) {
    const repo = this.getRepo(manager);
    const newComment = repo.create({
      content: body,
      profileId,
      postId,
      parentId: parentId ?? null,
      replyOnId: replyOnId ?? null,
      replyOnUsername: replyOnUsername ?? null,
    });

    return await repo.save(newComment);
  }

  async update(
    commentId: number,
    postId: number,
    payload: Partial<CommentEntity>,
    manager?: EntityManager,
  ) {
    await this.getRepo(manager).update(
      { id: commentId, postId },
      { ...payload },
    );
  }

  async delete(commentId: number, manager: EntityManager) {
    await this.getRepo(manager).update(
      { id: commentId, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );
  }

  async hardDelete(commentId: number, manager: EntityManager) {
    await this.getRepo(manager).delete({ id: commentId });
  }

  // ===================================================== Comment Counters ========================================================

  async incrementReplies(
    commentId: number,
    postId: number,
    manager?: EntityManager,
  ) {
    await this.getRepo(manager).increment(
      { id: commentId, postId },
      'repliesCount',
      1,
    );
  }

  async decrementReplies(
    commentId: number,
    postId?: number,
    manager?: EntityManager,
  ) {
    await this.getRepo(manager).decrement(
      { id: commentId, postId },
      'repliesCount',
      1,
    );
  }

  async incrementLikes(commentId: number, manager?: EntityManager) {
    await this.getRepo(manager).increment({ id: commentId }, 'likesCount', 1);
  }

  async decrementLikes(commentId: number, manager?: EntityManager) {
    await this.getRepo(manager).decrement({ id: commentId }, 'likesCount', 1);
  }
}
