type SearchSections = {
  profiles: 'profile';
  posts: 'post';
};

export interface DropdownItem<T extends keyof SearchSections> {
  id: number;
  type: SearchSections[T];
  primary: string;
  secondary: string;
  avatarUrl?: string;
}

export type DropdownSearchResponse = {
  [K in keyof SearchSections]: DropdownItem<K>[];
};

export interface SearchMeta {
  total: number | null;
  page: number | null;
  limit: number;
}
export interface SearchResult<T> {
  data: T[];
  meta: SearchMeta;
}
