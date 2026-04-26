import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeLikesTable1775675531486 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "post_likes" RENAME TO "likes"
    `);
    await queryRunner.query(`
      ALTER TABLE "likes" RENAME COLUMN "postId" TO "targetId"
    `);

    await queryRunner.query(`
      ALTER TABLE "likes"
      ADD COLUMN "targetType" varchar NOT NULL DEFAULT 'post'
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_post_likes_profileId_postId"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_likes_unique"
      ON "likes" ("profileId", "targetId", "targetType")
    `);
    await queryRunner.query(`
  UPDATE "posts" SET "likesCount" = 0;
`);

    await queryRunner.query(`
  UPDATE "posts" p
  SET "likesCount" = sub.count
  FROM (
    SELECT "targetId", COUNT(*) as count
    FROM "likes"
    WHERE "targetType" = 'post'
    GROUP BY "targetId"
  ) sub
  WHERE p.id = sub."targetId"
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_likes_unique"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_post_likes_profileId_postId"
      ON "likes" ("profileId", "targetId")
    `);

    await queryRunner.query(`
      ALTER TABLE "likes" DROP COLUMN "targetType"
    `);

    await queryRunner.query(`
      ALTER TABLE "likes" RENAME COLUMN "targetId" TO "postId"
    `);

    await queryRunner.query(`
      ALTER TABLE "likes" RENAME TO "post_likes"
    `);
  }
}
