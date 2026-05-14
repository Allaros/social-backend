import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { cleanupConfig } from '../cleanup.config';

@Injectable()
export class NotificationsCleanupService {
  constructor(private readonly dataSource: DataSource) {}

  @Cron(cleanupConfig.cron.notifications)
  async removeOrphanNotifications() {
    await this.dataSource.query(`
    DELETE FROM notifications n
    WHERE
      n."createdAt" < NOW() - INTERVAL '10 minutes'
      AND (
        (n."entityType" = 'post' AND NOT EXISTS (
          SELECT 1 FROM posts p WHERE p.id = n."entityId"
        ))
        OR
        (n."entityType" = 'comment' AND NOT EXISTS (
          SELECT 1 FROM comments c WHERE c.id = n."entityId"
        ))
      )
  `);
  }
}
