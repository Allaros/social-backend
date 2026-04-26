import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldsToComment1775658444616 implements MigrationInterface {
    name = 'AddFieldsToComment1775658444616'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" ADD "isEdited" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "deletedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "isEdited"`);
    }

}
