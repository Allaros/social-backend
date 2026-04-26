import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReplyFieldsToComment1777177126746 implements MigrationInterface {
  name = 'AddReplyFieldsToComment1777177126746';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "comments"
      ADD "replyOnId" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "comments"
      ADD "replyOnUsername" varchar
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_comments_replyOnId"
      ON "comments" ("replyOnId")
    `);

    await queryRunner.query(`
      ALTER TABLE "comments"
      ADD CONSTRAINT "FK_comments_replyOnId"
      FOREIGN KEY ("replyOnId")
      REFERENCES "comments"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "comments"
      DROP CONSTRAINT "FK_comments_replyOnId"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_comments_replyOnId"
    `);

    await queryRunner.query(`
      ALTER TABLE "comments"
      DROP COLUMN "replyOnUsername"
    `);

    await queryRunner.query(`
      ALTER TABLE "comments"
      DROP COLUMN "replyOnId"
    `);
  }
}
