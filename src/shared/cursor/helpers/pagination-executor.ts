import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { CursorCodec } from '../codec/cursor-codec';
import {
  CursorShape,
  CursorConfig,
  PaginationResult,
} from '../types/cursor.interface';

export class PaginationExecutor {
  static async paginate<
    TEntity extends ObjectLiteral,
    TRaw = unknown,
    TCursor extends CursorShape = CursorShape,
  >(
    qb: SelectQueryBuilder<TEntity>,
    limit: number,
    config: CursorConfig<TCursor>,
    getCursor: (entity: TEntity) => TCursor,
    codec: CursorCodec<TCursor>,
  ): Promise<PaginationResult<TEntity, TRaw>> {
    const result = await qb.limit(limit + 1).getRawAndEntities();

    const entities = result.entities;
    const raw = result.raw as TRaw[];

    const hasNext = entities.length > limit;

    if (hasNext) {
      entities.pop();
      raw.pop();
    }

    const nextCursor = hasNext
      ? codec.encode(getCursor(entities[entities.length - 1]))
      : null;

    return {
      data: entities,
      raw,
      nextCursor,
    };
  }
}
