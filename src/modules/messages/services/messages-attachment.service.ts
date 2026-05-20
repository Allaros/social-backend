import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageAttachmentEntity } from '../entities/messages-attachment.entity';
import { EntityManager, Repository } from 'typeorm';
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
          ...attachment,
          type: resolveAttachmentType(attachment.mimeType),
        };
      }),
    );

    return repo.save(newAttachments);
  }
}
