import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  Index,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '@app/modules/user/user.entity';
import { PostEntity } from '../post/entities/post.entity';
import { CommentEntity } from '../post/entities/comment.entity';
import { PostRepostEntity } from '../post/entities/repost.entity';
import { LikesEntity } from '../post/entities/like.entity';
import { SavedPostEntity } from '../post/entities/saved_posts';

@Entity('profiles')
export class ProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => UserEntity, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  @Index({ unique: true })
  @Column()
  userId: number;

  @Index({ unique: true })
  @Column({ length: 50 })
  username: string;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ length: 255, nullable: true })
  bio?: string;

  @Column({ default: 0 })
  postsCount: number;

  @Column({ default: 0 })
  followersCount: number;

  @Column({ default: 0 })
  followingCount: number;

  @OneToMany(() => PostEntity, (post) => post.profile)
  posts: PostEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.profile)
  comments: CommentEntity[];

  @OneToMany(() => PostRepostEntity, (repost) => repost.profile)
  reposts: PostRepostEntity[];

  @OneToMany(() => LikesEntity, (like) => like.profile)
  likes: LikesEntity[];

  @OneToMany(() => SavedPostEntity, (saved) => saved.profile)
  savedPosts: SavedPostEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
