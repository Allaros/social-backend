import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInitializedColumnToChat1782933378663 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chats"
      ADD COLUMN "isInitialized" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chats"
      DROP COLUMN "isInitialized";
    `);
  }
}
