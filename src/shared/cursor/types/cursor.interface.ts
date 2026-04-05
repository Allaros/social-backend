export type CursorPrimitive = string | number | Date;

export type CursorShape = Record<string, CursorPrimitive>;

export interface CursorConfig<TCursor extends CursorShape> {
  fields: readonly Extract<keyof TCursor, string>[];
  order: 'ASC' | 'DESC';
}

export interface PaginationResult<TEntity> {
  data: TEntity[];
  nextCursor: string | null;
}
