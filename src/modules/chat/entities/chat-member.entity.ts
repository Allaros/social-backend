import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ChatEntity } from './chat.entity';
import { ProfileEntity } from '@app/modules/profile/entities/profile.entity';
import { ChatMemberRoleEnum } from '../types/chat-member.interface';

@Entity('chat_members')
@Index(['chatId', 'profileId'], { unique: true })
@Index(['profileId'])
export class ChatMemberEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chatId: number;

  @ManyToOne(() => ChatEntity, (chat) => chat.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'chatId',
  })
  chat: ChatEntity;

  @Column()
  profileId: number;

  @ManyToOne(() => ProfileEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'profileId',
  })
  profile: ProfileEntity;

  @Column({
    type: 'enum',
    enum: ChatMemberRoleEnum,
    default: ChatMemberRoleEnum.MEMBER,
  })
  role: ChatMemberRoleEnum;

  @Column({ nullable: true, type: 'timestamptz' })
  restrictedUntil: Date | null;

  @Column({ default: false })
  isNotificationsMuted: boolean;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true })
  lastReadMessageId?: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastReadAt?: Date;

  @Column({ default: 0 })
  unreadCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  joinedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  leftAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
