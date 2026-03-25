import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFeedTables1774261358075 implements MigrationInterface {
    name = 'CreateFeedTables1774261358075'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."profile_name_trgm_idx"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_profile_username"`);
        await queryRunner.query(`DROP INDEX "public"."profile_username_trgm_idx"`);
        await queryRunner.query(`DROP INDEX "public"."profile_username_prefix_idx"`);
        await queryRunner.query(`CREATE TABLE "comments" ("id" SERIAL NOT NULL, "content" text NOT NULL, "profileId" integer NOT NULL, "postId" integer NOT NULL, "parentId" integer, "likesCount" integer NOT NULL DEFAULT '0', "repliesCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cf10f1192ad29abbdbf1b65c09" ON "comments" ("profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e44ddaaa6d058cb4092f83ad61" ON "comments" ("postId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8770bd9030a3d13c5f79a7d2e8" ON "comments" ("parentId") `);
        await queryRunner.query(`CREATE TABLE "post_likes" ("id" SERIAL NOT NULL, "profileId" integer NOT NULL, "postId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4ac7cb9daf243939c6eabb2e0d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cf73a599958082c301e7cfd427" ON "post_likes" ("profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6999d13aca25e33515210abaf1" ON "post_likes" ("postId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_452f2dfb29b3bbd19fe7570937" ON "post_likes" ("profileId", "postId") `);
        await queryRunner.query(`CREATE TABLE "post_reposts" ("id" SERIAL NOT NULL, "profileId" integer NOT NULL, "postId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3d702acbb75d42cb21d0133c153" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1fa403d7b370b885bd4a4d0b56" ON "post_reposts" ("profileId", "postId") `);
        await queryRunner.query(`CREATE TABLE "post_media" ("id" SERIAL NOT NULL, "postId" integer NOT NULL, "url" text NOT NULL, "type" character varying(20) NOT NULL, "previewUrl" text, "size" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_049edb1ce7ab3d2a98009b171d0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_57ddd3fc3584d7bd0f78e08f65" ON "post_media" ("createdAt") `);
        await queryRunner.query(`CREATE TYPE "public"."posts_visibility_enum" AS ENUM('public', 'followers', 'private')`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" SERIAL NOT NULL, "content" text NOT NULL, "viewsCount" integer NOT NULL DEFAULT '0', "repostsCount" integer NOT NULL DEFAULT '0', "likesCount" integer NOT NULL DEFAULT '0', "commentsCount" integer NOT NULL DEFAULT '0', "allowComments" boolean NOT NULL DEFAULT true, "visibility" "public"."posts_visibility_enum" NOT NULL DEFAULT 'public', "profileId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_62d7b65c760c8957c32a110c71" ON "posts" ("profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_deadbe5c51eae479d1fe0907ab" ON "posts" ("profileId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_46bc204f43827b6f25e0133dbf" ON "posts" ("createdAt") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d1ea35db5be7c08520d70dc03f" ON "profiles" ("username") `);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_cf10f1192ad29abbdbf1b65c098" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_8770bd9030a3d13c5f79a7d2e81" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_likes" ADD CONSTRAINT "FK_6999d13aca25e33515210abaf16" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_likes" ADD CONSTRAINT "FK_cf73a599958082c301e7cfd4277" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_reposts" ADD CONSTRAINT "FK_81b12801bf4296f529a5ff938af" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_reposts" ADD CONSTRAINT "FK_ee3811f98ad064a74c0d346b516" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_media" ADD CONSTRAINT "FK_4adcc5190e3b5c7e9001adef3b8" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_62d7b65c760c8957c32a110c717" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_62d7b65c760c8957c32a110c717"`);
        await queryRunner.query(`ALTER TABLE "post_media" DROP CONSTRAINT "FK_4adcc5190e3b5c7e9001adef3b8"`);
        await queryRunner.query(`ALTER TABLE "post_reposts" DROP CONSTRAINT "FK_ee3811f98ad064a74c0d346b516"`);
        await queryRunner.query(`ALTER TABLE "post_reposts" DROP CONSTRAINT "FK_81b12801bf4296f529a5ff938af"`);
        await queryRunner.query(`ALTER TABLE "post_likes" DROP CONSTRAINT "FK_cf73a599958082c301e7cfd4277"`);
        await queryRunner.query(`ALTER TABLE "post_likes" DROP CONSTRAINT "FK_6999d13aca25e33515210abaf16"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_8770bd9030a3d13c5f79a7d2e81"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_cf10f1192ad29abbdbf1b65c098"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d1ea35db5be7c08520d70dc03f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_46bc204f43827b6f25e0133dbf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_deadbe5c51eae479d1fe0907ab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_62d7b65c760c8957c32a110c71"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TYPE "public"."posts_visibility_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_57ddd3fc3584d7bd0f78e08f65"`);
        await queryRunner.query(`DROP TABLE "post_media"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1fa403d7b370b885bd4a4d0b56"`);
        await queryRunner.query(`DROP TABLE "post_reposts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_452f2dfb29b3bbd19fe7570937"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6999d13aca25e33515210abaf1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cf73a599958082c301e7cfd427"`);
        await queryRunner.query(`DROP TABLE "post_likes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8770bd9030a3d13c5f79a7d2e8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e44ddaaa6d058cb4092f83ad61"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cf10f1192ad29abbdbf1b65c09"`);
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`CREATE INDEX "profile_username_prefix_idx" ON "profiles" ("username") `);
        await queryRunner.query(`CREATE INDEX "profile_username_trgm_idx" ON "profiles" ("username") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_profile_username" ON "profiles" ("username") `);
        await queryRunner.query(`CREATE INDEX "profile_name_trgm_idx" ON "profiles" ("name") `);
    }

}
