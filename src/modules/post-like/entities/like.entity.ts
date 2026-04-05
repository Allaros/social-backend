import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ProfileEntity } from '@app/modules/profile/profile.entity';
import { PostEntity } from '@app/modules/post/entities/post.entity';

@Entity('post_likes')
@Index(['profileId', 'postId'], { unique: true })
export class LikesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  profileId: number;

  @Index()
  @Column()
  postId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => PostEntity, (post) => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

  @ManyToOne(() => ProfileEntity, (profile) => profile.likes, {
    onDelete: 'CASCADE',
  })
  profile: ProfileEntity;
}
