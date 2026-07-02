import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '@app/modules/redis/redis.service';
import { RecalculateUnreadMessagesUseCase } from '@app/modules/messages/use-cases/recalculate-unread-messages.usecase';
import { ChatService } from '@app/modules/chat/services/chat.service';

@Injectable()
export class CountersSelfHealingService {
  private readonly logger = new Logger(CountersSelfHealingService.name);

  private readonly CURSOR_KEY = 'counters:self-healing:cursor';

  private readonly BATCH_SIZE = 50;

  constructor(
    private readonly redisService: RedisService,
    private readonly chatService: ChatService,
    private readonly recalculateUnreadMessagesUseCase: RecalculateUnreadMessagesUseCase,
  ) {}

  private get redis() {
    return this.redisService.getClient();
  }

  @Cron('*/15 * * * *')
  async handle() {
    const lastProcessedChatId = Number(
      (await this.redis.get(this.CURSOR_KEY)) ?? 0,
    );

    const chats = await this.chatService.getChatsBatchAfterId({
      afterId: lastProcessedChatId,
      limit: this.BATCH_SIZE,
    });

    if (!chats.length) {
      await this.redis.set(this.CURSOR_KEY, 0);

      this.logger.log('Self-healing cursor reset');

      return;
    }

    for (const chat of chats) {
      await this.recalculateUnreadMessagesUseCase.executeForChat(chat.id);
    }

    const newCursor = chats[chats.length - 1].id;

    await this.redis.set(this.CURSOR_KEY, newCursor);

    this.logger.log(`Processed ${chats.length} chats. Cursor: ${newCursor}`);
  }
}
