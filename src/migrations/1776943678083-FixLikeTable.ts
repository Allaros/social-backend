import { MigrationInterface, QueryRunner } from 'typeorm';

export class LikesPolymorphicRefactor1700000000000 implements MigrationInterface {
  name = 'LikesPolymorphicRefactor1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "likes"
      DROP CONSTRAINT IF EXISTS "FK_6999d13aca25e33515210abaf16"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_452f2dfb29b3bbd19fe7570937"
    `);

    await queryRunner.query(`
      ALTER TABLE "likes"
      ALTER COLUMN "targetType" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_likes_unique"
      ON "likes" ("profileId", "targetId", "targetType")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_likes_unique"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_452f2dfb29b3bbd19fe7570937"
      ON "likes" ("profileId", "targetId")
    `);

    await queryRunner.query(`
      ALTER TABLE "likes"
      ADD CONSTRAINT "FK_6999d13aca25e33515210abaf16"
      FOREIGN KEY ("targetId") REFERENCES "posts"("id") ON DELETE CASCADE
    `);
  }
}
