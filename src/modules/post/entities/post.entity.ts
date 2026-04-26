import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProfileEntity } from '../../profile/profile.entity';
import { SavedPostEntity } from '@app/modules/post-saving/entities/saved_posts.entity';
import { PostMediaEntity } from '@app/modules/post-media/entities/media.entity';
import { PostRepostEntity } from './repost.entity';
import { CommentEntity } from '@app/modules/post-comments/entities/comment.entity';

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

  @Column({ default: false })
  isEdited: boolean;

  @OneToMany(() => SavedPostEntity, (saved) => saved.post)
  savedBy: SavedPostEntity[];

  @Column({ default: 0 })
  savingsCount: number;

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

  @OneToMany(() => PostRepostEntity, (repost) => repost.post)
  reposts: PostRepostEntity[];

  @Index()
  @Column()
  profileId: number;

  @DeleteDateColumn()
  deletedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
