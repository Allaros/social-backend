import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForwardMessageColumnAndDeleteIsEditedColumn1781463079303 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
         ALTER TABLE "messages"
         DROP COLUMN "isEdited"
      `);

    await queryRunner.query(`
         ALTER TABLE "messages"
         ADD COLUMN "forwardedFromMessageId" integer NULL
      `);

    await queryRunner.query(`
         CREATE INDEX "IDX_messages_forwardedFromMessageId"
         ON "messages" ("forwardedFromMessageId")
      `);

    await queryRunner.query(`
         ALTER TABLE "messages"
         ADD CONSTRAINT "FK_messages_forwardedFromMessage"
         FOREIGN KEY ("forwardedFromMessageId")
         REFERENCES "messages"("id")
         ON DELETE SET NULL
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
         ALTER TABLE "messages"
         DROP CONSTRAINT "FK_messages_forwardedFromMessage"
      `);

    await queryRunner.query(`
         DROP INDEX "public"."IDX_messages_forwardedFromMessageId"
      `);

    await queryRunner.query(`
         ALTER TABLE "messages"
         DROP COLUMN "forwardedFromMessageId"
      `);

    await queryRunner.query(`
         ALTER TABLE "messages"
         ADD COLUMN "isEdited" boolean NOT NULL DEFAULT false
      `);
  }
}
