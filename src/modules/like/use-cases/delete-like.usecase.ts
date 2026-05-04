import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LikeService } from '../services/like.service';
import { LikeTargetType } from '../types/like.interface';
import EventEmitter2 from 'eventemitter2';
import { CommentEvents, PostEvents } from '@app/shared/events/domain-events';
import { PostUnlikeEvent } from '../events/post-unlike.event';
import { CommentUnlikeEvent } from '../events/comment-unlike.event';

@Injectable()
export class DeleteLikeUseCase {
  constructor(
    private readonly likeService: LikeService,
    private readonly eventEmitter: EventEmitter2,
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

    await this.likeService.delete(targetId, targetType, currentProfileId);

    switch (targetType) {
      case LikeTargetType.POST: {
        this.eventEmitter.emit(
          PostEvents.POST_UNLIKED,
          new PostUnlikeEvent(targetId),
        );

        break;
      }
      case LikeTargetType.COMMENT: {
        this.eventEmitter.emit(
          CommentEvents.COMMENT_UNLIKED,
          new CommentUnlikeEvent(targetId),
        );

        break;
      }
      default: {
        throw new BadRequestException('Укажите правильный тип цели');
      }
    }

    return { success: true };
  }
}
