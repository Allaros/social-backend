import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class CreateFollowsTable1777539901930 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "follows_status_enum" AS ENUM ('active', 'pending', 'denied')
    `);

    await queryRunner.createTable(
      new Table({
        name: 'follows',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'followerId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'followingId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'follows_status_enum',
            default: `'active'`,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createUniqueConstraint(
      'follows',
      new TableUnique({
        name: 'UQ_FOLLOWS_FOLLOWER_FOLLOWING',
        columnNames: ['followerId', 'followingId'],
      }),
    );

    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'IDX_FOLLOWS_FOLLOWER_ID',
        columnNames: ['followerId'],
      }),
    );

    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'IDX_FOLLOWS_FOLLOWING_ID',
        columnNames: ['followingId'],
      }),
    );

    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'IDX_FOLLOWS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.query(`
      ALTER TABLE "follows"
      ADD CONSTRAINT "FK_FOLLOWS_FOLLOWER_PROFILE"
      FOREIGN KEY ("followerId")
      REFERENCES "profiles"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "follows"
      ADD CONSTRAINT "FK_FOLLOWS_FOLLOWING_PROFILE"
      FOREIGN KEY ("followingId")
      REFERENCES "profiles"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "follows"
      ADD CONSTRAINT "CHK_FOLLOWS_NO_SELF"
      CHECK ("followerId" != "followingId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "CHK_FOLLOWS_NO_SELF"`,
    );

    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_FOLLOWS_FOLLOWING_PROFILE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_FOLLOWS_FOLLOWER_PROFILE"`,
    );

    await queryRunner.dropIndex('follows', 'IDX_FOLLOWS_STATUS');
    await queryRunner.dropIndex('follows', 'IDX_FOLLOWS_FOLLOWING_ID');
    await queryRunner.dropIndex('follows', 'IDX_FOLLOWS_FOLLOWER_ID');

    await queryRunner.dropUniqueConstraint(
      'follows',
      'UQ_FOLLOWS_FOLLOWER_FOLLOWING',
    );

    await queryRunner.dropTable('follows');

    await queryRunner.query(`DROP TYPE "follows_status_enum"`);
  }
}
