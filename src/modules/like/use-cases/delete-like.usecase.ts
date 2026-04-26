import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LikeService } from '../services/like.service';
import { DataSource } from 'typeorm';
import { PostCounterService } from '@app/modules/post-counters/post-counter.service';
import { LikeTargetType } from '../types/like.interface';
import { CommentsCountersService } from '@app/modules/comments-counters/comments-counters.service';

@Injectable()
export class DeleteLikeUseCase {
  constructor(
    private readonly likeService: LikeService,
    private readonly dataSource: DataSource,
    private readonly postCounterService: PostCounterService,
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

    if (!existingLike) throw new NotFoundException('Не удалось найти лайк');

    await this.dataSource.transaction(async (manager) => {
      await this.likeService.delete(
        targetId,
        targetType,
        currentProfileId,
        manager,
      );

      switch (targetType) {
        case LikeTargetType.POST: {
          await this.postCounterService.updateCounters(
            targetId,
            { likesCount: -1 },
            manager,
          );

          break;
        }
        case LikeTargetType.COMMENT: {
          await this.commentsCounterService.updateCounters(
            targetId,
            { likesCount: -1 },
            manager,
          );

          break;
        }
        default: {
          throw new BadRequestException('Укажите правильный тип цели');
        }
      }
    });

    return { success: true };
  }
}
