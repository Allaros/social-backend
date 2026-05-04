import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { EntityManager, MoreThan, Repository } from 'typeorm';
import {
  AggregatedActor,
  NotificationEntityType,
  NotificationMetadata,
  NotificationType,
} from '../types/notification.interface';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager
      ? manager.getRepository(NotificationEntity)
      : this.notificationRepository;
  }

  async create({
    actorId,
    receiverId,
    type,
    entityId,
    entityType,
    metadata,
    manager,
  }: {
    actorId: number;
    receiverId: number;
    type: NotificationType;
    entityId?: number;
    entityType?: NotificationEntityType;
    metadata?: NotificationMetadata;
    manager?: EntityManager;
  }) {
    const repo = this.getRepo(manager);

    return await repo.insert({
      actorId,
      receiverId,
      type,
      entityId,
      entityType,
      metadata,
    });
  }

  async findRecentDuplicate({
    actorId,
    receiverId,
    type,
    entityId,
    entityType,
    dedupMs,
  }: {
    actorId: number;
    receiverId: number;
    type: NotificationType;
    entityId?: number;
    entityType?: NotificationEntityType;
    dedupMs: number;
  }) {
    return this.notificationRepository.findOne({
      where: {
        actorId,
        receiverId,
        type,
        entityId,
        entityType,
        createdAt: MoreThan(new Date(Date.now() - dedupMs)),
      },
    });
  }

  async findAggregateTarget({
    entityType,
    receiverId,
    type,
    entityId,
  }: {
    receiverId: number;
    type: NotificationType;
    entityId?: number;
    entityType?: NotificationEntityType;
  }) {
    return await this.notificationRepository.findOne({
      where: {
        entityId,
        entityType,
        receiverId,
        type,
        isRead: false,
        createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async incrementAggregation({
    actorId,
    notificationId,
    manager,
  }: {
    notificationId: number;
    actorId: number;
    manager: EntityManager;
  }) {
    const repo = this.getRepo(manager);

    const notification = await repo
      .createQueryBuilder('notification')
      .setLock('pessimistic_write')
      .where('notification.id = :id', { id: notificationId })
      .getOne();

    if (!notification) return;

    const currentActors = notification.metadata?.aggregatedActors ?? [];

    const alreadyExists = currentActors.some((a) => a.actorId === actorId);

    const now = new Date().toISOString();

    const updatedActors = alreadyExists
      ? currentActors.map((a) =>
          a.actorId === actorId ? { ...a, createdAt: now } : a,
        )
      : [{ actorId, createdAt: now }, ...currentActors].slice(0, 5);

    const currentCount = notification.metadata?.aggregatedCount ?? 0;

    const aggregatedCount = alreadyExists ? currentCount : currentCount + 1;

    await repo.update(notificationId, {
      actorId,
      isRead: false,
      isSeen: false,
      createdAt: new Date(),
      metadata: {
        ...notification.metadata,
        aggregatedCount,
        aggregatedActors: updatedActors,
      },
    });
  }

  async findById(id: number, manager?: EntityManager) {
    const repo = this.getRepo(manager);
    return await repo.findOne({ where: { id } });
  }

  async delete(id: number, manager?: EntityManager) {
    const repo = this.getRepo(manager);

    await repo.delete({ id });
  }

  async lockAggregationTarget({
    receiverId,
    type,
    entityId,
    entityType,
    manager,
  }: {
    receiverId: number;
    type: NotificationType;
    entityId?: number;
    entityType?: NotificationEntityType;
    manager: EntityManager;
  }) {
    return manager
      .getRepository(NotificationEntity)
      .createQueryBuilder('notification')
      .setLock('pessimistic_write')
      .where('notification.receiverId = :receiverId', {
        receiverId,
      })
      .andWhere('notification.type = :type', {
        type,
      })
      .andWhere(
        entityId
          ? 'notification.entityId = :entityId'
          : 'notification.entityId IS NULL',
        { entityId },
      )
      .andWhere(
        entityType
          ? 'notification.entityType = :entityType'
          : 'notification.entityType IS NULL',
        { entityType },
      )
      .andWhere('notification.isRead = false')
      .orderBy('notification.createdAt', 'DESC')
      .limit(1)
      .getOne();
  }

  async updateAggregation({
    notificationId,
    aggregatedActors,
    aggregatedCount,
    metadata,
    manager,
  }: {
    notificationId: number;
    aggregatedActors: AggregatedActor[];
    aggregatedCount: number;
    metadata: NotificationMetadata;
    manager: EntityManager;
  }) {
    const repo = this.getRepo(manager);

    const latestActor = aggregatedActors[0];

    if (!latestActor) {
      await repo.delete(notificationId);
      return;
    }

    await repo.update(notificationId, {
      actorId: aggregatedActors[0].actorId,
      metadata: {
        ...metadata,
        aggregatedActors,
        aggregatedCount,
      },
    });
  }
}
