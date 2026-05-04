import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostService } from '../services/post.service';
import { DeleteMediaUseCase } from '@app/modules/file/use-cases/delete-media.usecase';
import EventEmitter2 from 'eventemitter2';
import { PostHardDeleteEvent } from '../events/post-hard-delete.event';
import { PostEvents } from '@app/shared/events/domain-events';

@Injectable()
export class HardDeletePostUseCase {
  constructor(
    private readonly postService: PostService,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async execute(postId: number, profileId: number) {
    let mediaToDelete: { url: string }[] = [];

    const post = await this.postService.findByIdWithDeleted(postId);

    if (!post) throw new NotFoundException('Пост не найден');

    if (post.profileId !== profileId)
      throw new ForbiddenException('Вы не являетесь владельцем данного поста');

    mediaToDelete = post.media.map((m) => ({ url: m.url })) || [];

    await this.postService.postDelete(post);

    this.eventEmitter.emit(
      PostEvents.POST_HARD_DELETE,
      new PostHardDeleteEvent(postId, profileId),
    );

    if (mediaToDelete.length) {
      await this.deleteMediaUseCase.execute(mediaToDelete, 'post-media');
    }

    return { success: true };
  }
}
