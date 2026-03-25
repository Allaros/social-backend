import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostsTrigram1774261826838 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX idx_posts_content_trgm
      ON posts
      USING gin (content gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_posts_content_trgm;
    `);
  }
}
