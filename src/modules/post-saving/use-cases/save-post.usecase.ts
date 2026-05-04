import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostSavingService } from '../services/post-saving.service';
import { PostService } from '@app/modules/post/services/post.service';
import EventEmitter2 from 'eventemitter2';
import { PostEvents } from '@app/shared/events/domain-events';
import { PostSaveEvent } from '../events/post-save.event';

@Injectable()
export class SavePostUseCase {
  constructor(
    private readonly postSavingService: PostSavingService,
    private readonly postService: PostService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(postId: number, profileId: number) {
    const post = await this.postService.findById(postId);

    if (!post) throw new NotFoundException('Пост не найден');

    const existingSaving = await this.postSavingService.findExisting(
      postId,
      profileId,
    );

    if (existingSaving) throw new ConflictException('Пост уже сохранен');

    const saving = this.postSavingService.create(postId, profileId);

    this.eventEmitter.emit(
      PostEvents.POST_SAVED,
      new PostSaveEvent(postId, profileId),
    );

    return saving;
  }
}
