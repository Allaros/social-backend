import { Module } from '@nestjs/common';
import { UserCleanupService } from './services/user-cleanup.service';

@Module({
  providers: [UserCleanupService],
})
export class CleanupModule {}
