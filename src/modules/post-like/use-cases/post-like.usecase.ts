import { BadRequestException, Injectable } from '@nestjs/common';
import { PostLikeService } from '../services/post-like.service';
import { DataSource } from 'typeorm';
import { PostCounterService } from '@app/modules/post-counters/post-counter.service';

@Injectable()
export class PostLikeUseCase {
  constructor(
    private readonly postLikeService: PostLikeService,
    private readonly postCounterService: PostCounterService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(postId: number, currentProfileId: number) {
    const existingLike = await this.postLikeService.findByIds(
      postId,
      currentProfileId,
    );

    if (existingLike) {
      throw new BadRequestException('Нельзя поставить два лайка');
    }

    const like = await this.dataSource.transaction(async (manager) => {
      const newLike = this.postLikeService.create(
        postId,
        currentProfileId,
        manager,
      );

      await this.postCounterService.updateCounters(
        postId,
        { likesCount: 1 },
        manager,
      );

      return newLike;
    });

    return like;
  }
}
