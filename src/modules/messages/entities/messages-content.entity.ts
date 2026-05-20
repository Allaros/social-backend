import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('message_contents')
export class MessageContentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  content?: string;

  @Column({
    nullable: true,
  })
  encryptionVersion?: number;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata?: Record<string, any>;

  @Column({ default: false })
  isPurged: boolean;

  @Column({ default: false })
  isEncrypted: boolean;

  @Column({ nullable: true })
  checksum?: string;

  @Column({ nullable: true })
  blurhash?: string;

  @Column({ nullable: true })
  fileName?: string;

  @CreateDateColumn()
  createdAt: Date;
}
