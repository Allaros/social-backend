import { ObjectLiteral, Repository } from 'typeorm';

export class CounterUpdater {
  static async update<
    TEntity extends ObjectLiteral,
    TField extends keyof TEntity,
  >(
    repository: Repository<TEntity>,
    entityId: number,
    updates: Partial<Record<TField, number>>,
  ) {
    const operations: Promise<unknown>[] = [];

    for (const [field, value] of Object.entries(updates) as [
      TField,
      number,
    ][]) {
      if (value === undefined || value === 0) {
        continue;
      }

      const where = {
        id: entityId,
      } as unknown as Partial<TEntity>;

      if (value > 0) {
        operations.push(repository.increment(where, field as string, value));
      } else {
        operations.push(
          repository.decrement(where, field as string, Math.abs(value)),
        );
      }
    }

    await Promise.all(operations);
  }
}
