import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ChatTypeEnum } from '../types/chat.interface';
import { ChatMemberEntity } from './chat-member.entity';

@Entity('chats')
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ChatTypeEnum,
    default: ChatTypeEnum.DIRECT,
  })
  type: ChatTypeEnum;

  @Column({
    type: 'varchar',
    unique: true,
    nullable: true,
  })
  directKey: string | null;

  @Column({
    type: 'varchar',
    unique: true,
    nullable: true,
    length: 120,
  })
  slug: string | null;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true, length: 120 })
  title?: string;

  @Column({ nullable: true, length: 500 })
  description?: string;

  @Column({ nullable: true })
  avatarStorageKey?: string;

  @OneToMany(() => ChatMemberEntity, (member) => member.chat)
  members: ChatMemberEntity[];

  @Column({ nullable: true })
  lastMessageId?: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt?: Date;

  @Column({ default: 0 })
  messagesCount: number;

  @Column({ default: 0 })
  membersCount: number;

  @Column({
    nullable: true,
  })
  deletedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
