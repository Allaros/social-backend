import {
  NotificationType,
  NotificationEntityType,
} from '@app/modules/notification/types/notification.interface';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateNotificationsTable1777638285658 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notifications',

        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },

          {
            name: 'receiverId',
            type: 'integer',
            isNullable: false,
          },

          {
            name: 'actorId',
            type: 'integer',
            isNullable: false,
          },

          {
            name: 'type',
            type: 'enum',
            enum: Object.values(NotificationType),
            enumName: 'notification_type_enum',
            isNullable: false,
          },

          {
            name: 'entityId',
            type: 'integer',
            isNullable: true,
          },

          {
            name: 'entityType',
            type: 'enum',
            enum: Object.values(NotificationEntityType),
            enumName: 'notification_entity_type_enum',
            isNullable: true,
          },

          {
            name: 'isRead',
            type: 'boolean',
            default: false,
          },

          {
            name: 'isSeen',
            type: 'boolean',
            default: false,
          },

          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },

          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKeys('notifications', [
      new TableForeignKey({
        columnNames: ['receiverId'],
        referencedTableName: 'profiles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),

      new TableForeignKey({
        columnNames: ['actorId'],
        referencedTableName: 'profiles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndices('notifications', [
      new TableIndex({
        name: 'IDX_NOTIFICATIONS_RECEIVER_CREATED',
        columnNames: ['receiverId', 'createdAt'],
      }),

      new TableIndex({
        name: 'IDX_NOTIFICATIONS_UNREAD',
        columnNames: ['receiverId', 'isRead'],
      }),

      new TableIndex({
        name: 'IDX_NOTIFICATIONS_TYPE',
        columnNames: ['type'],
      }),

      new TableIndex({
        name: 'IDX_NOTIFICATIONS_ENTITY',
        columnNames: ['entityId', 'entityType'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notifications');

    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);

    await queryRunner.query(
      `DROP TYPE IF EXISTS "notification_entity_type_enum"`,
    );
  }
}
