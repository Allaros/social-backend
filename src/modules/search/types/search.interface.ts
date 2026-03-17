type SearchSections = {
  profiles: 'profile';
};

export interface DropdownItem<T extends keyof SearchSections> {
  id: number;
  type: SearchSections[T];
  primary: string;
  secondary: string;
}

export type DropdownSearchResponse = {
  [K in keyof SearchSections]: DropdownItem<K>[];
};
