import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './types/search.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { UserEntity } from '../user/user.entity';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('dropdown')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  dropdownSearch(@Query('q') query: string, @CurrentUser() user: UserEntity) {
    return this.searchService.dropdownSearch(query, user.profile.id);
  }
  @Get()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async globalSearch(
    @Query() { q, type, limit, page }: SearchQueryDto,
    @CurrentUser() user: UserEntity,
  ) {
    return await this.searchService.searchResults(
      q,
      type,
      limit,
      page,
      user.profile.id,
    );
  }
}
