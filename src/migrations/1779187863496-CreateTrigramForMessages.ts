import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrigramForMessages1779187863496 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_message_content_text_trgm
      ON message_contents
      USING gin (content gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_message_content_text_trgm;
    `);
  }
}
