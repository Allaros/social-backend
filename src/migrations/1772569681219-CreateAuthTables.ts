import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthTables1772569681219 implements MigrationInterface {
    name = 'CreateAuthTables1772569681219'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "providers" ("id" SERIAL NOT NULL, "provider" character varying NOT NULL, "providerId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_af13fc2ebf382fe0dad2e4793aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_496f36cd14cb9ecf327b6675bd" ON "providers" ("userId", "provider") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0cb633fc827fadb2b2c2de1529" ON "providers" ("provider", "providerId") `);
        await queryRunner.query(`CREATE TABLE "tokens" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "device" character varying, "userAgent" character varying, "ip" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "UQ_6a8ca5961656d13c16c04079dd3" UNIQUE ("token"), CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "password_recoveries" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_b854e1e8b1d99bf7ecf0008bc1f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying, "isVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "verifications" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "linkToken" character varying, "expiresAt" TIMESTAMP NOT NULL, "tempToken" character varying, "recoveryToken" character varying, "recoveryExpiresAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_2127ad1b143cf012280390b01d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "providers" ADD CONSTRAINT "FK_b0a257f97e76b698c4935b27d7d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "FK_d417e5d35f2434afc4bd48cb4d2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_recoveries" ADD CONSTRAINT "FK_db7fec32d882a9412d8081037ae" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "verifications" ADD CONSTRAINT "FK_e6a542673f9abc1f67e5f32abaf" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verifications" DROP CONSTRAINT "FK_e6a542673f9abc1f67e5f32abaf"`);
        await queryRunner.query(`ALTER TABLE "password_recoveries" DROP CONSTRAINT "FK_db7fec32d882a9412d8081037ae"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_d417e5d35f2434afc4bd48cb4d2"`);
        await queryRunner.query(`ALTER TABLE "providers" DROP CONSTRAINT "FK_b0a257f97e76b698c4935b27d7d"`);
        await queryRunner.query(`DROP TABLE "verifications"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "password_recoveries"`);
        await queryRunner.query(`DROP TABLE "tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cb633fc827fadb2b2c2de1529"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_496f36cd14cb9ecf327b6675bd"`);
        await queryRunner.query(`DROP TABLE "providers"`);
    }

}
