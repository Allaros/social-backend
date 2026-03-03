import { MigrationInterface, QueryRunner } from "typeorm";

export class ReworkRefreshTokenEntity1772457112888 implements MigrationInterface {
    name = 'ReworkRefreshTokenEntity1772457112888'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "revoked" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "UQ_6a8ca5961656d13c16c04079dd3" UNIQUE ("token")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "UQ_6a8ca5961656d13c16c04079dd3"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "revoked"`);
    }

}
