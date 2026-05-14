import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastSeenAtColumnToProfile1778594386484 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "profiles"
      ADD COLUMN "lastSeenAt" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "profiles"
      DROP COLUMN "lastSeenAt"
    `);
  }
}
