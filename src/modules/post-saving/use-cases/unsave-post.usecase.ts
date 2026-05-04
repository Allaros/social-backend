import { Injectable } from '@nestjs/common';
import { PostSavingService } from '../services/post-saving.service';
import EventEmitter2 from 'eventemitter2';
import { PostEvents } from '@app/shared/events/domain-events';
import { PostUnsaveEvent } from '../events/post-unsave.event';

@Injectable()
export class UnsavePostUseCase {
  constructor(
    private readonly postSavingService: PostSavingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(postId: number, profileId: number) {
    await this.postSavingService.delete(postId, profileId);

    this.eventEmitter.emit(
      PostEvents.POST_UNSAVED,
      new PostUnsaveEvent(postId, profileId),
    );

    return { success: true };
  }
}
