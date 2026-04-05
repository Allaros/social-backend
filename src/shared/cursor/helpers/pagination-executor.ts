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
    TCursor extends CursorShape,
  >(
    qb: SelectQueryBuilder<TEntity>,
    limit: number,
    config: CursorConfig<TCursor>,
    getCursor: (entity: TEntity) => TCursor,
    codec: CursorCodec<TCursor>,
  ): Promise<PaginationResult<TEntity>> {
    const entities = await qb.take(limit + 1).getMany();

    const hasNext = entities.length > limit;

    if (hasNext) {
      entities.pop();
    }

    const nextCursor = hasNext
      ? codec.encode(getCursor(entities[entities.length - 1]))
      : null;

    return {
      data: entities,
      nextCursor,
    };
  }
}
