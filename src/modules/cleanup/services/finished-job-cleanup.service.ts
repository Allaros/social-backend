import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { cleanupConfig } from '../cleanup.config';

@Injectable()
export class FinishedJobsCleanupService {
  constructor(private readonly dataSource: DataSource) {}

  @Cron(cleanupConfig.cron.jobs)
  async cleanupFinishedJobs() {
    await this.dataSource.query(`
      DELETE FROM chat_deletion_jobs
      WHERE status = 'done'
        AND "finishedAt" < NOW() - INTERVAL '7 days'
    `);
  }
}
