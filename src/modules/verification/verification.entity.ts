import {
  Entity,
  PrimaryGeneratedColumn,
  Index,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { VerificationType } from './types/verification.interface';

@Index(['tokenHash'], { unique: true })
@Entity('verifications')
export class VerificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tokenHash: string;

  @Column({ type: 'text', nullable: true })
  codeHash: string | null;

  @Column({ default: 0 })
  attempts: number;

  @Index()
  @Column({
    type: 'enum',
    enum: VerificationType,
  })
  type: VerificationType;

  @Index()
  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  usedAt?: Date;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  email?: string;

  @ManyToOne(() => UserEntity, (user) => user.verifications, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
