import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePostTables1774888243933 implements MigrationInterface {
    name = 'UpdatePostTables1774888243933'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_posts_content_trgm"`);
        await queryRunner.query(`CREATE TABLE "saved_posts" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "profileId" integer, "postId" integer, CONSTRAINT "PK_868375ca4f041a2337a1c1a6634" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "savingsCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "saved_posts" ADD CONSTRAINT "FK_47f2dd0883794cfab2774e50224" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_posts" ADD CONSTRAINT "FK_4704fa96cd2b591592a8cfaee56" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_posts" DROP CONSTRAINT "FK_4704fa96cd2b591592a8cfaee56"`);
        await queryRunner.query(`ALTER TABLE "saved_posts" DROP CONSTRAINT "FK_47f2dd0883794cfab2774e50224"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "savingsCount"`);
        await queryRunner.query(`DROP TABLE "saved_posts"`);
        await queryRunner.query(`CREATE INDEX "idx_posts_content_trgm" ON "posts" ("content") `);
    }

}
