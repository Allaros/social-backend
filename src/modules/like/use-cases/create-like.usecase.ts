import { BadRequestException, Injectable } from '@nestjs/common';
import { LikeService } from '../services/like.service';
import { DataSource } from 'typeorm';
import { PostCounterService } from '@app/modules/post-counters/post-counter.service';
import { LikeTargetType } from '../types/like.interface';
import { CommentsCountersService } from '@app/modules/comments-counters/comments-counters.service';

@Injectable()
export class CreateLikeUseCase {
  constructor(
    private readonly likeService: LikeService,
    private readonly postCounterService: PostCounterService,
    private readonly dataSource: DataSource,
    private readonly commentsCounterService: CommentsCountersService,
  ) {}

  async execute(
    targetId: number,
    currentProfileId: number,
    targetType: LikeTargetType,
  ) {
    const existingLike = await this.likeService.findByIds(
      targetId,
      currentProfileId,
      targetType,
    );

    if (existingLike) {
      throw new BadRequestException('Нельзя поставить два лайка');
    }

    const like = await this.dataSource.transaction(async (manager) => {
      const newLike = await this.likeService.create(
        targetId,
        currentProfileId,
        targetType,
        manager,
      );

      switch (targetType) {
        case LikeTargetType.POST: {
          await this.postCounterService.updateCounters(
            targetId,
            { likesCount: 1 },
            manager,
          );
          break;
        }
        case LikeTargetType.COMMENT: {
          await this.commentsCounterService.updateCounters(
            targetId,
            {
              likesCount: 1,
            },
            manager,
          );
          break;
        }
        default:
          throw new BadRequestException('Укажите праильный тип цели');
      }

      return newLike;
    });

    return like;
  }
}
