import { Injectable, NotFoundException } from '@nestjs/common';
import { PostLikeService } from '../services/post-like.service';
import { DataSource } from 'typeorm';
import { PostCounterService } from '@app/modules/post-counters/post-counter.service';

@Injectable()
export class PostUnlikeUseCase {
  constructor(
    private readonly postLikeService: PostLikeService,
    private readonly dataSource: DataSource,
    private readonly postCounterService: PostCounterService,
  ) {}

  async execute(postId: number, currentProfileId: number) {
    const existingLike = await this.postLikeService.findByIds(
      postId,
      currentProfileId,
    );

    if (!existingLike) throw new NotFoundException('Не удалось найти лайк');

    await this.dataSource.transaction(async (manager) => {
      await this.postLikeService.delete(postId, currentProfileId, manager);

      await this.postCounterService.updateCounters(
        postId,
        { likesCount: -1 },
        manager,
      );
    });

    return { success: true };
  }
}
