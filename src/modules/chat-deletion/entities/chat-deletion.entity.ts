import { ChatEntity } from '@app/modules/chat/entities/chat.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ChatDeletionJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DONE = 'done',
  FAILED = 'failed',
}

@Entity('chat_deletion_job')
export class ChatDeletionJobEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chatId: number;

  @OneToOne(() => ChatEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'chatId',
  })
  chat: ChatEntity;

  @Column({
    type: 'varchar',
    default: ChatDeletionJobStatus.PENDING,
  })
  status: ChatDeletionJobStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    nullable: true,
  })
  startedAt?: Date;

  @Column({
    nullable: true,
  })
  finishedAt?: Date;
}
