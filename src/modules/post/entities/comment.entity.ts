import { ProfileEntity } from '@app/modules/profile/profile.entity';
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
import { PostEntity } from './post.entity';

@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Index()
  @Column()
  profileId: number;

  @ManyToOne(() => ProfileEntity, (profile) => profile.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profileId' })
  profile: ProfileEntity;

  @Index()
  @Column()
  postId: number;

  @ManyToOne(() => PostEntity, (post) => post.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

  @Index()
  @Column({ nullable: true })
  parentId?: number;

  @ManyToOne(() => CommentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent?: CommentEntity;

  @OneToMany(() => CommentEntity, (comment) => comment.parent)
  replies: CommentEntity[];

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  repliesCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
