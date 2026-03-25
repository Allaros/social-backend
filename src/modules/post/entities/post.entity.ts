import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProfileEntity } from '../../profile/profile.entity';
import { CommentEntity } from './comment.entity';
import { LikesEntity } from './like.entity';
import { PostRepostEntity } from './repost.entity';
import { PostMediaEntity } from './media.entity';
import { SavedPostEntity } from './saved_posts';

@Index(['createdAt'])
@Index(['profileId', 'createdAt'])
@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @OneToMany(() => PostMediaEntity, (media) => media.post, { cascade: true })
  media: PostMediaEntity[];

  @OneToMany(() => SavedPostEntity, (saved) => saved.post)
  savedBy: SavedPostEntity[];

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: 0 })
  repostsCount: number;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Column({ default: true })
  allowComments: boolean;

  @Column({
    type: 'enum',
    enum: ['public', 'followers', 'private'],
    default: 'public',
  })
  visibility: 'public' | 'followers' | 'private';

  @ManyToOne(() => ProfileEntity, (profile) => profile.posts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profileId' })
  profile: ProfileEntity;

  @OneToMany(() => CommentEntity, (comment) => comment.post)
  comments: CommentEntity[];

  @OneToMany(() => LikesEntity, (likes) => likes.post)
  likes: LikesEntity[];

  @OneToMany(() => PostRepostEntity, (repost) => repost.post)
  reposts: PostRepostEntity[];

  @Index()
  @Column()
  profileId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
