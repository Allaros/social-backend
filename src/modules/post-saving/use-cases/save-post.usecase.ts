import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostSavingService } from '../services/post-saving.service';
import { DataSource } from 'typeorm';
import { PostService } from '@app/modules/post/services/post.service';
import { PostCounterService } from '@app/modules/post-counters/post-counter.service';

@Injectable()
export class SavePostUseCase {
  constructor(
    private readonly postSavingService: PostSavingService,
    private readonly postService: PostService,
    private readonly postCounterService: PostCounterService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(postId: number, profileId: number) {
    const saveNote = await this.dataSource.transaction(async (manager) => {
      const post = await this.postService.findById(postId);

      if (!post) throw new NotFoundException('Пост не найден');

      const existingSaving = await this.postSavingService.findExisting(
        postId,
        profileId,
        manager,
      );

      if (existingSaving) throw new ConflictException('Пост уже сохранен');

      const saving = this.postSavingService.create(postId, profileId, manager);

      await this.postCounterService.updateCounters(
        postId,
        { savingsCount: 1 },
        manager,
      );

      return saving;
    });

    return saveNote;
  }
}
