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
import { PostRepostEntity } from '../post/entities/repost.entity';
import { SavedPostEntity } from '../post-saving/entities/saved_posts.entity';
import { CommentEntity } from '../post-comments/entities/comment.entity';
import { FollowsEntity } from '../follows/entities/follows.entity';

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

  @OneToMany(() => SavedPostEntity, (saved) => saved.profile)
  savedPosts: SavedPostEntity[];

  @OneToMany(() => FollowsEntity, (follow) => follow.follower)
  followingRelations: FollowsEntity[];

  @OneToMany(() => FollowsEntity, (follow) => follow.following)
  followerRelations: FollowsEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
