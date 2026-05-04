import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { Repository } from 'typeorm';
import { NotificationCursor } from '../types/notification.interface';
import { CursorConfig } from '@app/shared/cursor/types/cursor.interface';
import { CursorQueryHelper } from '@app/shared/cursor/helpers/cursor-qb';

@Injectable()
export class NotificationQueryService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  buildNotificationQuery({
    receiverId,
    cursor,
  }: {
    receiverId: number;
    cursor: NotificationCursor | null;
  }) {
    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.receiverId = :receiverId', { receiverId })
      .orderBy('notification.createdAt', 'DESC')
      .addOrderBy('notification.id', 'DESC');

    qb.leftJoinAndSelect('notification.actor', 'actor');

    const config: CursorConfig<NotificationCursor> = {
      fields: ['createdAt', 'id'],
      order: 'DESC',
    };

    CursorQueryHelper.applyCursor(qb, 'notification', cursor, config);

    return qb;
  }
}
