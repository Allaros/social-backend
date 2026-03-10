import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthTables1772895065279 implements MigrationInterface {
    name = 'CreateAuthTables1772895065279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."providers_provider_enum" AS ENUM('google', 'password', 'magic')`);
        await queryRunner.query(`CREATE TABLE "providers" ("id" SERIAL NOT NULL, "provider" "public"."providers_provider_enum" NOT NULL, "providerId" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_af13fc2ebf382fe0dad2e4793aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9a52fe54012f73442a6e852bc5" ON "providers" ("providerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b0a257f97e76b698c4935b27d7" ON "providers" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_496f36cd14cb9ecf327b6675bd" ON "providers" ("userId", "provider") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0cb633fc827fadb2b2c2de1529" ON "providers" ("provider", "providerId") `);
        await queryRunner.query(`CREATE TABLE "profiles" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "nickname" character varying(50) NOT NULL, "slug" character varying(120) NOT NULL, "name" character varying(100) NOT NULL, "avatarUrl" character varying, "bio" character varying(255), "postsCount" integer NOT NULL DEFAULT '0', "followersCount" integer NOT NULL DEFAULT '0', "followingCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_315ecd98bd1a42dcf2ec4e2e98" UNIQUE ("userId"), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_315ecd98bd1a42dcf2ec4e2e98" ON "profiles" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a53cb2bff1e60b60dc581f86e0" ON "profiles" ("nickname") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_db923a19f15d5ceaa2b27ecb58" ON "profiles" ("slug") `);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" SERIAL NOT NULL, "refreshTokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "ip" character varying, "userAgent" character varying, "device" character varying, "platform" character varying, "location" character varying, "lastUsedAt" TIMESTAMP, "revokedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying, "isVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."verifications_type_enum" AS ENUM('email', 'magic_link', 'password_reset')`);
        await queryRunner.query(`CREATE TABLE "verifications" ("id" SERIAL NOT NULL, "tokenHash" character varying NOT NULL, "codeHash" text, "attempts" integer NOT NULL DEFAULT '0', "type" "public"."verifications_type_enum" NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "metadata" json, "email" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_2127ad1b143cf012280390b01d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5df3ab071d30f737686fcf2c27" ON "verifications" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_9396c99745fc563de4d5b13aed" ON "verifications" ("expiresAt") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f7c45b6c6a7292359df48b4fba" ON "verifications" ("tokenHash") `);
        await queryRunner.query(`ALTER TABLE "providers" ADD CONSTRAINT "FK_b0a257f97e76b698c4935b27d7d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "verifications" ADD CONSTRAINT "FK_e6a542673f9abc1f67e5f32abaf" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verifications" DROP CONSTRAINT "FK_e6a542673f9abc1f67e5f32abaf"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985"`);
        await queryRunner.query(`ALTER TABLE "providers" DROP CONSTRAINT "FK_b0a257f97e76b698c4935b27d7d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f7c45b6c6a7292359df48b4fba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9396c99745fc563de4d5b13aed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5df3ab071d30f737686fcf2c27"`);
        await queryRunner.query(`DROP TABLE "verifications"`);
        await queryRunner.query(`DROP TYPE "public"."verifications_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db923a19f15d5ceaa2b27ecb58"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a53cb2bff1e60b60dc581f86e0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_315ecd98bd1a42dcf2ec4e2e98"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cb633fc827fadb2b2c2de1529"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_496f36cd14cb9ecf327b6675bd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b0a257f97e76b698c4935b27d7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a52fe54012f73442a6e852bc5"`);
        await queryRunner.query(`DROP TABLE "providers"`);
        await queryRunner.query(`DROP TYPE "public"."providers_provider_enum"`);
    }

}
