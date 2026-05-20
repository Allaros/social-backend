import { MigrationInterface, QueryRunner } from 'typeorm';

export class RepairMessageType1779108398305 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
      DROP COLUMN "type"
    `);

    await queryRunner.query(`
      DROP TYPE "messages_type_enum"
    `);

    await queryRunner.query(`
      CREATE TYPE "messages_type_enum" AS ENUM (
        'default',
        'system',
        'call'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD COLUMN "type" "messages_type_enum"
      NOT NULL
      DEFAULT 'default'
    `);

    await queryRunner.query(`
      ALTER TABLE "message_contents"
      RENAME COLUMN "encryptedContent" TO "content"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "message_contents"
      RENAME COLUMN "content" TO "encryptedContent"
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
      DROP COLUMN "type"
    `);

    await queryRunner.query(`
      DROP TYPE "messages_type_enum"
    `);

    await queryRunner.query(`
      CREATE TYPE "messages_type_enum" AS ENUM (
        'text',
        'image',
        'video',
        'voice',
        'file',
        'system',
        'call'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD COLUMN "type" "messages_type_enum"
      NOT NULL
      DEFAULT 'text'
    `);
  }
}
