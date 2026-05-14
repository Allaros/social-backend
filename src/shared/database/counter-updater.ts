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

  static async updateAndReturn<
    TEntity extends ObjectLiteral,
    TField extends keyof TEntity,
  >(
    repository: Repository<TEntity>,
    entityId: number,
    updates: Partial<Record<TField, number>>,
    returningFields: TField[],
  ): Promise<Pick<TEntity, TField>> {
    const set: Record<string, () => string> = {};

    for (const [field, value] of Object.entries(updates) as [
      TField,
      number,
    ][]) {
      if (value === undefined || value === 0) {
        continue;
      }

      const operator = value > 0 ? '+' : '-';

      set[field as string] = () =>
        `"${String(field)}" ${operator} ${Math.abs(value)}`;
    }

    const result = await repository
      .createQueryBuilder()
      .update()
      .set(set)
      .where('id = :entityId', { entityId })
      .returning(returningFields.map(String))
      .execute();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return result.raw[0] as Pick<TEntity, TField>;
  }
}
