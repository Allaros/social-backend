import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import EventEmitter2 from 'eventemitter2';
import { DataSource } from 'typeorm';
import { cleanupConfig } from '../cleanup.config';
import { ChatMarkedAsDeletedEvent } from '@app/modules/chat/events/chat-marked-as-deleted.event';
import { ChatEvents } from '@app/shared/events/domain-events';

@Injectable()
export class ChatsCleanupService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(cleanupConfig.cron.chats)
  async scheduleEmptyChatsForDeletion() {
    const rows: { id: number }[] = await this.dataSource.query(`
      SELECT c.id
      FROM chats c
      INNER JOIN chat_members cm ON cm."chatId" = c.id
      WHERE c."deletedAt" IS NULL
      GROUP BY c.id
      HAVING
        COUNT(*) > 0
        AND COUNT(*) FILTER (WHERE cm."leftAt" IS NULL) = 0
        AND MAX(cm."leftAt") < NOW() - INTERVAL '24 hours'
    `);

    if (!rows.length) {
      return;
    }

    const chatIds = rows.map((row) => Number(row.id));

    await this.dataSource
      .createQueryBuilder()
      .update('chats')
      .set({
        deletedAt: () => 'NOW()',
      })
      .where('id IN (:...chatIds)', { chatIds })
      .execute();

    for (const chatId of chatIds) {
      this.eventEmitter.emit(
        ChatEvents.CHAT_MARKED_AS_DELETED,
        new ChatMarkedAsDeletedEvent({
          chatId,
        }),
      );
    }
  }
}
