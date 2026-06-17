import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHiddenMessagesTable1780216827203 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "hidden_messages" (
        "id" SERIAL NOT NULL,
        "messageId" integer NOT NULL,
        "chatMemberId" integer NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hidden_messages_id"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_hidden_messages_chat_member_id"
      ON "hidden_messages" ("chatMemberId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_hidden_messages_message_member_unique"
      ON "hidden_messages" ("messageId", "chatMemberId")
    `);

    await queryRunner.query(`
      ALTER TABLE "hidden_messages"
      ADD CONSTRAINT "FK_hidden_messages_message"
      FOREIGN KEY ("messageId")
      REFERENCES "messages"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "hidden_messages"
      ADD CONSTRAINT "FK_hidden_messages_chat_member"
      FOREIGN KEY ("chatMemberId")
      REFERENCES "chat_members"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "hidden_messages"
      DROP CONSTRAINT "FK_hidden_messages_chat_member"
    `);

    await queryRunner.query(`
      ALTER TABLE "hidden_messages"
      DROP CONSTRAINT "FK_hidden_messages_message"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_hidden_messages_message_member_unique"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_hidden_messages_chat_member_id"
    `);

    await queryRunner.query(`
      DROP TABLE "hidden_messages"
    `);
  }
}
