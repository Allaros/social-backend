import { Injectable } from '@nestjs/common';
import { ProfileService } from '../profile/profile.service';
import { DropdownItem, DropdownSearchResponse } from './types/search.interface';

@Injectable()
export class SearchService {
  constructor(private readonly profileService: ProfileService) {}
  async dropdownSearch(query: string): Promise<DropdownSearchResponse> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery || normalizedQuery.length < 2) {
      return { profiles: [] };
    }
    const limit = 4;

    const [profiles] = await Promise.all([
      this.profileService.findProfiles(normalizedQuery, limit),
    ]);

    const profilesItems: DropdownItem<'profiles'>[] = profiles.data.map(
      (profile) => ({
        id: profile.id,
        primary: profile.name,
        secondary: `@${profile.username}`,
        type: 'profile',
      }),
    );

    return {
      profiles: profilesItems,
    };
  }

  async searchResults(
    query: string,
    type: 'profiles' | 'posts',
    limit: number = 20,
    page: number,
  ) {
    if (type === 'profiles') {
      return this.profileService.findProfiles(query, limit, page);
    }
    if (type === 'posts') {
      return { data: [], total: null };
    }
  }
}
