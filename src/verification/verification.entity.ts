import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity('verifications')
export class VerificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column({ nullable: true })
  linkToken?: string;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  tempToken?: string;

  @Column({ nullable: true })
  recoveryToken?: string;

  @Column({ nullable: true })
  recoveryExpiresAt?: Date;

  @ManyToOne(() => UserEntity, (user) => user.emailVerifications, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
