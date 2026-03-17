import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrigramIndexToProfile1773575810297 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS profile_nickname_trgm_idx
      ON profiles
      USING GIN (nickname gin_trgm_ops);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS profile_name_trgm_idx
      ON profiles
      USING GIN (name gin_trgm_ops);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS profile_slug_trgm_idx
      ON profiles
      USING GIN (slug gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS profile_slug_trgm_idx;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS profile_name_trgm_idx;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS profile_nickname_trgm_idx;
    `);
  }
}
