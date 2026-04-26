import {
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { LikeTargetType } from '../types/like.interface';

@Entity('likes')
@Index(['profileId', 'targetId', 'targetType'], { unique: true })
export class LikeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  profileId: number;

  @Index()
  @Column()
  targetId: number;

  @Column({ type: 'enum', enum: LikeTargetType })
  targetType: LikeTargetType;

  @CreateDateColumn()
  createdAt: Date;
}
