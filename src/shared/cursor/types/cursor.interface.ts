export type CursorPrimitive = string | number;

export type CursorShape = {
  [key: string]: CursorPrimitive;
};

export interface CursorConfig<TCursor extends CursorShape> {
  fields: readonly Extract<keyof TCursor, string>[];
  order: 'ASC' | 'DESC';
}

export interface PaginationResult<TEntity, TRaw = unknown> {
  data: TEntity[];
  raw: TRaw[];
  nextCursor: string | null;
}
