import { Injectable } from '@nestjs/common';
import { ChatCleanupUseCase } from '../use-case/chat-cleanup.usecase';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ChatCLeanupScheduler {
  private isRunning = false;
  constructor(private readonly chatCleanupUseCase: ChatCleanupUseCase) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCleanup() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      await this.chatCleanupUseCase.execute();
    } finally {
      this.isRunning = false;
    }
  }
}
