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
import { ChatMemberEntity } from '@app/modules/chat/entities/chat-member.entity';

@Entity('hidden_messages')
@Index(['messageId', 'chatMemberId'], { unique: true })
@Index(['chatMemberId'])
export class HiddenMessageEntity {
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

  @Column()
  chatMemberId: number;

  @ManyToOne(() => ChatMemberEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'chatMemberId',
  })
  chatMember: ChatMemberEntity;

  @CreateDateColumn()
  createdAt: Date;
}
