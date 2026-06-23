import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ChatDeletionJobEntity,
  ChatDeletionJobStatus,
} from '../entities/chat-deletion.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class ChatDeletionService {
  constructor(
    @InjectRepository(ChatDeletionJobEntity)
    private readonly chatDeletionJobRepository: Repository<ChatDeletionJobEntity>,
  ) {}

  async create(chatId: number) {
    const existing = await this.chatDeletionJobRepository.findOne({
      where: {
        chatId,
        status: In([
          ChatDeletionJobStatus.PENDING,
          ChatDeletionJobStatus.PROCESSING,
        ]),
      },
    });

    if (existing) {
      return existing;
    }

    const job = this.chatDeletionJobRepository.create({
      chatId,
      status: ChatDeletionJobStatus.PENDING,
    });

    await this.chatDeletionJobRepository.save(job);
  }

  async markProcessing(id: number) {
    await this.chatDeletionJobRepository.update(id, {
      status: ChatDeletionJobStatus.PROCESSING,
      startedAt: new Date(),
    });
  }

  async markDone(id: number) {
    await this.chatDeletionJobRepository.update(id, {
      status: ChatDeletionJobStatus.DONE,
      finishedAt: new Date(),
    });
  }

  async markFailed(id: number) {
    await this.chatDeletionJobRepository.update(id, {
      status: ChatDeletionJobStatus.FAILED,
    });
  }

  async getActiveJobs(limit: number = 5) {
    return await this.chatDeletionJobRepository.find({
      where: {
        status: In([
          ChatDeletionJobStatus.PENDING,
          ChatDeletionJobStatus.PROCESSING,
        ]),
      },
      take: limit,
    });
  }

  async deleteFinishedJobs(days = 7) {
    const date = new Date();

    date.setDate(date.getDate() - days);

    await this.chatDeletionJobRepository
      .createQueryBuilder()
      .delete()
      .where('status = :status', {
        status: ChatDeletionJobStatus.DONE,
      })
      .andWhere('finishedAt < :date', {
        date,
      })
      .execute();
  }
}
