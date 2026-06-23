import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableUnique,
  TableColumn,
} from 'typeorm';

export class CreateDeletionJobsTableAndBlackList1781865126797 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'chats',
      new TableColumn({
        name: 'deletedAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'chat_deletion_job',

        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },

          {
            name: 'chatId',
            type: 'int',
          },

          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },

          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },

          {
            name: 'startedAt',
            type: 'timestamp',
            isNullable: true,
          },

          {
            name: 'finishedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'chat_deletion_job',
      new TableUnique({
        name: 'UQ_CHAT_DELETION_JOB_CHAT',
        columnNames: ['chatId'],
      }),
    );

    await queryRunner.createForeignKey(
      'chat_deletion_job',
      new TableForeignKey({
        columnNames: ['chatId'],
        referencedTableName: 'chats',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'chat_deletion_job',
      new TableIndex({
        name: 'IDX_CHAT_DELETION_JOB_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'profile_blacklist',

        columns: [
          {
            name: 'blockerId',
            type: 'int',
            isPrimary: true,
          },

          {
            name: 'blockedId',
            type: 'int',
            isPrimary: true,
          },

          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('profile_blacklist', [
      new TableForeignKey({
        columnNames: ['blockerId'],
        referencedTableName: 'profiles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),

      new TableForeignKey({
        columnNames: ['blockedId'],
        referencedTableName: 'profiles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndex(
      'profile_blacklist',
      new TableIndex({
        name: 'IDX_PROFILE_BLACKLIST_BLOCKER',
        columnNames: ['blockerId'],
      }),
    );

    await queryRunner.createIndex(
      'profile_blacklist',
      new TableIndex({
        name: 'IDX_PROFILE_BLACKLIST_BLOCKED',
        columnNames: ['blockedId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('profile_blacklist');

    await queryRunner.dropTable('chat_deletion_job');

    await queryRunner.dropColumn('chats', 'deletedAt');
  }
}
