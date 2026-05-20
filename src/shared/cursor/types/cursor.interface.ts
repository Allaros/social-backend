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

export interface CompositeCursorField<TCursor extends CursorShape> {
  key: Extract<keyof TCursor, string>;
  column: string;
}

export interface CompositeCursorConfig<TCursor extends CursorShape> {
  fields: CompositeCursorField<TCursor>[];
  order: 'ASC' | 'DESC';
}
