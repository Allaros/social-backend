import { ChatMemberEntity } from '@app/modules/chat/entities/chat-member.entity';
import { ChatEntity } from '@app/modules/chat/entities/chat.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  MessageStatusEnum,
  MessagesTypeEnum,
} from '../types/messages.interface';
import { MessageContentEntity } from './messages-content.entity';
import { MessageAttachmentEntity } from './messages-attachment.entity';

@Entity('messages')
@Index(['chatId', 'createdAt'])
@Index(['senderMemberId'])
@Index(['replyToMessageId'])
@Index(['forwardedFromMessageId'])
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chatId: number;

  @ManyToOne(() => ChatEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'chatId',
  })
  chat: ChatEntity;

  @Column({ nullable: true })
  senderMemberId: number | null;

  @ManyToOne(() => ChatMemberEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'senderMemberId',
  })
  senderMember?: ChatMemberEntity;

  @Column({
    nullable: true,
    length: 120,
  })
  clientId?: string;

  @Column({
    type: 'enum',
    enum: MessagesTypeEnum,
    default: MessagesTypeEnum.DEFAULT,
  })
  type: MessagesTypeEnum;

  @Column({
    type: 'enum',
    enum: MessageStatusEnum,
    default: MessageStatusEnum.SENT,
  })
  status: MessageStatusEnum;

  @Column({ nullable: true })
  contentId?: number | null;

  @OneToOne(() => MessageContentEntity, {
    nullable: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'contentId',
  })
  content?: MessageContentEntity;

  @OneToMany(() => MessageAttachmentEntity, (attachment) => attachment.message)
  attachments: MessageAttachmentEntity[];

  @Column({ default: false })
  hasAttachments: boolean;

  @Column({ nullable: true })
  replyToMessageId?: number | null;

  @ManyToOne(() => MessageEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'replyToMessageId',
  })
  replyToMessage?: MessageEntity;

  @Column({ nullable: true })
  forwardedFromMessageId?: number | null;

  @ManyToOne(() => MessageEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'forwardedFromMessageId',
  })
  forwardedFromMessage?: MessageEntity;

  @Column({ type: 'timestamptz', nullable: true })
  editedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
