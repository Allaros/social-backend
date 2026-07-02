import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MessageEntity } from './messages.entity';
import { MessagesAttachmentEnum } from '../types/messages-attachment.interface';

@Entity('message_attachments')
@Index(['messageId'])
export class MessageAttachmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  messageId: number;

  @ManyToOne(() => MessageEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'messageId',
  })
  message: MessageEntity;

  @Column({
    type: 'enum',
    enum: MessagesAttachmentEnum,
  })
  type: MessagesAttachmentEnum;

  @Column()
  storageKey: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column({ type: 'integer', nullable: true })
  width: number | null;

  @Column({ type: 'integer', nullable: true })
  height: number | null;

  @Column({ type: 'integer', nullable: true })
  duration: number | null;

  @Column({ type: 'varchar', nullable: true })
  thumbnailKey: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
