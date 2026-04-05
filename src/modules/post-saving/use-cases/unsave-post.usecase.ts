import { Injectable } from '@nestjs/common';
import { PostSavingService } from '../services/post-saving.service';
import { DataSource } from 'typeorm';
import { PostCounterService } from '@app/modules/post-counters/post-counter.service';

@Injectable()
export class UnsavePostUseCase {
  constructor(
    private readonly postSavingService: PostSavingService,
    private readonly postCounterService: PostCounterService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(postId: number, profileId: number) {
    await this.dataSource.transaction(async (manager) => {
      await this.postSavingService.delete(postId, profileId, manager);

      await this.postCounterService.updateCounters(
        postId,
        { savingsCount: -1 },
        manager,
      );
    });

    return { success: true };
  }
}
