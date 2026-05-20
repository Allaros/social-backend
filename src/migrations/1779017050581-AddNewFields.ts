import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddNewFields1779017050581 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('chats', 'avatarUrl', 'avatarStorageKey');

    await queryRunner.renameColumn(
      'chat_members',
      'isMuted',
      'isNotificationsMuted',
    );

    await queryRunner.addColumn(
      'chat_members',
      new TableColumn({
        name: 'restrictedUntil',
        type: 'timestamptz',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('chat_members', 'restrictedUntil');

    await queryRunner.renameColumn(
      'chat_members',
      'isNotificationsMuted',
      'isMuted',
    );

    await queryRunner.renameColumn('chats', 'avatarStorageKey', 'avatarUrl');
  }
}
