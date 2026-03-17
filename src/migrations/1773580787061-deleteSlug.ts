import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeleteSlug1773580787061 implements MigrationInterface {
  name = 'DeleteSlug1773580787061';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."profile_nickname_trgm_idx"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."profile_slug_trgm_idx"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_a53cb2bff1e60b60dc581f86e0"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_db923a19f15d5ceaa2b27ecb58"`,
    );

    await queryRunner.query(`
      ALTER TABLE "profiles"
      ADD COLUMN "username" varchar(50)
    `);

    await queryRunner.query(`
      UPDATE "profiles"
      SET "username" = COALESCE("nickname", 'user_' || "id")
    `);

    await queryRunner.query(`
      ALTER TABLE "profiles"
      ALTER COLUMN "username" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_profile_username"
      ON "profiles" ("username")
    `);

    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "nickname"`);

    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "slug"`);

    await queryRunner.query(`
      CREATE INDEX "profile_username_trgm_idx"
      ON "profiles"
      USING GIN ("username" gin_trgm_ops)
    `);

    await queryRunner.query(`
      CREATE INDEX "profile_username_prefix_idx"
      ON "profiles" ("username" text_pattern_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "profile_username_prefix_idx"`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "profile_username_trgm_idx"`);

    await queryRunner.query(`ALTER TABLE "profiles" ADD "slug" varchar(120)`);

    await queryRunner.query(
      `ALTER TABLE "profiles" ADD "nickname" varchar(50)`,
    );

    await queryRunner.query(`
      UPDATE "profiles"
      SET
        "nickname" = "username",
        "slug" = "username"
    `);

    await queryRunner.query(
      `ALTER TABLE "profiles" ALTER COLUMN "slug" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "profiles" ALTER COLUMN "nickname" SET NOT NULL`,
    );

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_db923a19f15d5ceaa2b27ecb58"
      ON "profiles" ("slug")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_a53cb2bff1e60b60dc581f86e0"
      ON "profiles" ("nickname")
    `);

    await queryRunner.query(`
      CREATE INDEX "profile_nickname_trgm_idx"
      ON "profiles"
      USING GIN ("nickname" gin_trgm_ops)
    `);

    await queryRunner.query(`
      CREATE INDEX "profile_slug_trgm_idx"
      ON "profiles"
      USING GIN ("slug" gin_trgm_ops)
    `);

    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "username"`);
  }
}
