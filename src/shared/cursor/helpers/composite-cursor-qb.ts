import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { CompositeCursorConfig } from '../types/cursor.interface';

export class CompositeCursorQueryHelper {
  static applyCompositeCursor<
    TEntity extends ObjectLiteral,
    TCursor extends Record<string, any>,
  >(
    qb: SelectQueryBuilder<TEntity>,
    cursor: TCursor | null,
    config: CompositeCursorConfig<TCursor>,
  ): SelectQueryBuilder<TEntity> {
    if (!cursor) {
      return qb;
    }

    const { fields, order } = config;

    const conditions: string[] = [];
    const params: Record<string, any> = {};

    fields.forEach((field, index) => {
      const parts: string[] = [];

      for (let i = 0; i < index; i++) {
        const prev = fields[i];

        parts.push(`${prev.column} = :${prev.key}`);

        params[prev.key] = cursor[prev.key];
      }

      const operator = order === 'DESC' ? '<' : '>';

      parts.push(`${field.column} ${operator} :${field.key}`);

      params[field.key] = cursor[field.key];

      conditions.push(`(${parts.join(' AND ')})`);
    });

    qb.andWhere(conditions.join(' OR '), params);

    return qb;
  }
}
