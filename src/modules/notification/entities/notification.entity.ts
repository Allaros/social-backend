import { ProfileEntity } from '@app/modules/profile/profile.entity';
import {
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import {
  NotificationEntityType,
  NotificationMetadata,
  NotificationType,
} from '../types/notification.interface';

@Entity('notifications')
@Index('IDX_NOTIFICATIONS_RECEIVER_CREATED', ['receiverId', 'createdAt'])
@Index('IDX_NOTIFICATIONS_UNREAD', ['receiverId', 'isRead'])
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  receiverId: number;

  @ManyToOne(() => ProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiverId' })
  receiver: ProfileEntity;

  @Column()
  actorId: number;

  @ManyToOne(() => ProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actorId' })
  actor: ProfileEntity;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ nullable: true })
  entityId?: number;

  @Column({ type: 'enum', nullable: true, enum: NotificationEntityType })
  entityType?: NotificationEntityType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isSeen: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: NotificationMetadata;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt: Date;
}
