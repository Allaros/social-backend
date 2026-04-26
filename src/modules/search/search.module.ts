import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { FeedModule } from '../feed/feed.module';

@Module({
  imports: [ProfileModule, FeedModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
