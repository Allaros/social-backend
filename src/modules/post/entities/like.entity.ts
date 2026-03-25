import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostEntity } from './post.entity';
import { ProfileEntity } from '@app/modules/profile/profile.entity';

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
