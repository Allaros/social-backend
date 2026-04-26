import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEditFlagForPost1775406020195 implements MigrationInterface {
    name = 'AddEditFlagForPost1775406020195'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ADD "isEdited" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "isEdited"`);
    }

}
