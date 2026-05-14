import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { cleanupConfig } from '../cleanup.config';

@Injectable()
export class LikeCleanupService {
  constructor(private readonly dataSource: DataSource) {}

  @Cron(cleanupConfig.cron.likes)
  async removeOrphanLikes() {
    await this.dataSource.query(`
			 DELETE FROM likes l
      WHERE 
        (l.targetType = 'post' AND NOT EXISTS (
          SELECT 1 FROM posts p WHERE p.id = l.targetId
        ))
        OR
        (l.targetType = 'comment' AND NOT EXISTS (
          SELECT 1 FROM comments c WHERE c.id = l.targetId
        ))
	`);
  }
}
