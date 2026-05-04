import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FollowStatus } from '../types/follows.interface';
import { ProfileEntity } from '@app/modules/profile/profile.entity';

@Entity('follows')
@Unique('UQ_FOLLOWS_FOLLOWER_FOLLOWING', ['followerId', 'followingId'])
@Index('IDX_FOLLOWS_FOLLOWER_ID', ['followerId'])
@Index('IDX_FOLLOWS_FOLLOWING_ID', ['followingId'])
@Index('IDX_FOLLOWS_STATUS', ['status'])
export class FollowsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  followerId: number;

  @ManyToOne(() => ProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerId' })
  follower: ProfileEntity;

  @Column()
  followingId: number;

  @ManyToOne(() => ProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followingId' })
  following: ProfileEntity;

  @Column({
    type: 'enum',
    enum: FollowStatus,
    default: FollowStatus.ACTIVE,
  })
  status: FollowStatus;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt: Date;
}
