import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { CursorConfig } from '../types/cursor.interface';

export class CursorQueryHelper {
  static applyCursor<
    TEntity extends ObjectLiteral,
    TCursor extends Record<string, any>,
  >(
    qb: SelectQueryBuilder<TEntity>,
    alias: string,
    cursor: TCursor | null,
    config: CursorConfig<TCursor>,
  ): SelectQueryBuilder<TEntity> {
    if (!cursor) return qb;

    const { fields, order } = config;

    const conditions: string[] = [];
    const params: Record<string, any> = {};

    fields.forEach((field, index) => {
      const parts: string[] = [];

      for (let i = 0; i < index; i++) {
        const f = fields[i];
        parts.push(`${alias}."${f}" = :${f}`);
        params[f] = cursor[f];
      }

      const operator = order === 'DESC' ? '<' : '>';
      parts.push(`${alias}."${field}" ${operator} :${field}`);
      params[field] = cursor[field];

      conditions.push(`(${parts.join(' AND ')})`);
    });

    qb.andWhere(conditions.join(' OR '), params);

    return qb;
  }
}
