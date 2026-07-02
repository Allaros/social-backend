import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageAttachmentEntity } from '../entities/messages-attachment.entity';
import { EntityManager, In, Repository } from 'typeorm';
import { MessageAttachmentDto } from '../types/messages-attachment.dto';
import { resolveAttachmentType } from '../helpers/attachment-type-resolver';

@Injectable()
export class MessagesAttachmentService {
  constructor(
    @InjectRepository(MessageAttachmentEntity)
    private readonly messagesAttachmentRepository: Repository<MessageAttachmentEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager
      ? manager.getRepository(MessageAttachmentEntity)
      : this.messagesAttachmentRepository;
  }

  async createMany({
    attachments,
    messageId,
    manager,
  }: {
    messageId: number;
    attachments: MessageAttachmentDto[];
    manager?: EntityManager;
  }) {
    const repo = this.getRepo(manager);

    const newAttachments = repo.create(
      attachments.map((attachment) => {
        return {
          messageId: messageId,
          type: resolveAttachmentType(attachment.mimeType),
          ...attachment,
        };
      }),
    );

    return repo.save(newAttachments);
  }

  async deleteMany(ids: number[], manager?: EntityManager) {
    await this.getRepo(manager).delete(ids);
  }

  async findManyById(ids: number[], manager?: EntityManager) {
    return await this.getRepo(manager).find({ where: { id: In(ids) } });
  }

  async getStorageKeysUsage(storageKeys: string[]) {
    if (!storageKeys.length) {
      return new Map<string, number>();
    }

    const rows = await this.messagesAttachmentRepository
      .createQueryBuilder('attachment')
      .select('attachment.storageKey', 'storageKey')
      .addSelect('COUNT(*)', 'count')
      .where('attachment.storageKey IN (:...storageKeys)', {
        storageKeys,
      })
      .groupBy('attachment.storageKey')
      .getRawMany<{
        storageKey: string;
        count: string;
      }>();

    return new Map(rows.map((row) => [row.storageKey, Number(row.count)]));
  }
}
