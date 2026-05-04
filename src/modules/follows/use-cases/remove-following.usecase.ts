import { Injectable, NotFoundException } from '@nestjs/common';
import { FollowsService } from '../services/follows.service';
import EventEmitter2 from 'eventemitter2';
import { FollowingEvents } from '@app/shared/events/domain-events';
import { FollowingDeleteEvent } from '../events/following-delete.event';

@Injectable()
export class RemoveFollowingUseCase {
  constructor(
    private readonly followsService: FollowsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    followerId,
    followingId,
  }: {
    followerId: number;
    followingId: number;
  }) {
    const currentFollowing = await this.followsService.findRelation(
      followerId,
      followingId,
    );

    if (!currentFollowing)
      throw new NotFoundException(
        'Не удалось найти подписку. Возможно она уже была отменена',
      );

    await this.followsService.delete(followerId, followingId);

    this.eventEmitter.emit(
      FollowingEvents.FOLLOWING_DELETED,
      new FollowingDeleteEvent(followerId, followingId),
    );

    return { success: true };
  }
}
