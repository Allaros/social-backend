import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { UserEntity } from '@app/modules/user/user.entity';
import { cleanupConfig } from '../cleanup.config';

@Injectable()
export class UserCleanupService {
  constructor(private readonly dataSource: DataSource) {}

  @Cron(cleanupConfig.cron.users)
  async removeUnverifiedUsers() {
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(UserEntity)
      .where('isVerified = false')
      .andWhere("createdAt < NOW() - INTERVAL '24 hours'")
      .execute();
  }
}
