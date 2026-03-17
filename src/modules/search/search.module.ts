import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [ProfileModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
