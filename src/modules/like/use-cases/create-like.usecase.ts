import { BadRequestException, Injectable } from '@nestjs/common';
import { LikeService } from '../services/like.service';
import { LikeTargetType } from '../types/like.interface';
import EventEmitter2 from 'eventemitter2';
import { CommentEvents, PostEvents } from '@app/shared/events/domain-events';
import { PostLikeEvent } from '../events/post-like.event';
import { CommentLikeEvent } from '../events/comment-like.event';

@Injectable()
export class CreateLikeUseCase {
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

    if (existingLike) {
      throw new BadRequestException('Нельзя поставить два лайка');
    }

    const newLike = await this.likeService.create(
      targetId,
      currentProfileId,
      targetType,
    );

    switch (targetType) {
      case LikeTargetType.POST: {
        this.eventEmitter.emit(
          PostEvents.POST_LIKED,
          new PostLikeEvent(targetId),
        );
        break;
      }
      case LikeTargetType.COMMENT: {
        this.eventEmitter.emit(
          CommentEvents.COMMENT_LIKED,
          new CommentLikeEvent(targetId),
        );
        break;
      }
      default:
        throw new BadRequestException('Укажите праильный тип цели');
    }

    return newLike;
  }
}
