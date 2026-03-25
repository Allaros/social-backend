import {
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { PostEntity } from './post.entity';
import { ProfileEntity } from '@app/modules/profile/profile.entity';

@Entity('post_reposts')
@Index(['profileId', 'postId'], { unique: true })
export class PostRepostEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  profileId: number;

  @Column()
  postId: number;

  @ManyToOne(() => PostEntity, (post) => post.reposts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

  @ManyToOne(() => ProfileEntity, (profile) => profile.reposts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profileId' })
  profile: ProfileEntity;

  @CreateDateColumn()
  createdAt: Date;
}
