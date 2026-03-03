import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePasswordRecoveryEntity1772480082231 implements MigrationInterface {
    name = 'CreatePasswordRecoveryEntity1772480082231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "password_recoveries" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_b854e1e8b1d99bf7ecf0008bc1f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "password_recoveries" ADD CONSTRAINT "FK_db7fec32d882a9412d8081037ae" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_recoveries" DROP CONSTRAINT "FK_db7fec32d882a9412d8081037ae"`);
        await queryRunner.query(`DROP TABLE "password_recoveries"`);
    }

}
