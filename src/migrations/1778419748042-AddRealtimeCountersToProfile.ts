import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRealtimeCountersToProfile1778419748042 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "profiles"
      ADD COLUMN "unreadNotificationsCount" integer NOT NULL DEFAULT 0,
      ADD COLUMN "unseenNotificationsCount" integer NOT NULL DEFAULT 0,
      ADD COLUMN "unreadMessagesCount" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "profiles"
      DROP COLUMN "unreadMessagesCount",
      DROP COLUMN "unseenNotificationsCount",
      DROP COLUMN "unreadNotificationsCount"
    `);
  }
}
