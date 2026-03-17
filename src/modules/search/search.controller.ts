import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './types/search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('dropdown')
  dropdownSearch(@Query('q') query: string) {
    return this.searchService.dropdownSearch(query);
  }
  @Get()
  async globalSearch(@Query() { q, type, limit, page }: SearchQueryDto) {
    return await this.searchService.searchResults(q, type, limit, page);
  }
}
