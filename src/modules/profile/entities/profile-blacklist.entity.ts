import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ProfileEntity } from './profile.entity';

@Entity('profile_blacklist')
export class ProfileBlacklist {
  @PrimaryColumn()
  blockerId: number;

  @PrimaryColumn()
  blockedId: number;

  @ManyToOne(() => ProfileEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'blockerId',
  })
  blocker: ProfileEntity;

  @ManyToOne(() => ProfileEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'blockedId',
  })
  blocked: ProfileEntity;

  @CreateDateColumn()
  createdAt: Date;
}
