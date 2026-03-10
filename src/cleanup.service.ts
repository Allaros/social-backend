import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { UserEntity } from '@app/modules/user/user.entity';

@Injectable()
export class CleanupService {
  constructor(private readonly dataSource: DataSource) {}

  @Cron('0 */6 * * *')
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
