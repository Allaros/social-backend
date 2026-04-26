import { PostEntity } from '@app/modules/post/entities/post.entity';
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
  parentId?: number | null;

  @ManyToOne(() => CommentEntity)
  @JoinColumn({ name: 'parentId' })
  parent?: CommentEntity;

  @Index()
  @Column({ type: 'int', nullable: true })
  replyOnId?: number | null;

  @ManyToOne(() => CommentEntity, { nullable: true })
  @JoinColumn({ name: 'replyOnId' })
  replyOn?: CommentEntity;

  @Column({ type: 'varchar', nullable: true })
  replyOnUsername?: string | null;

  @OneToMany(() => CommentEntity, (comment) => comment.parent)
  replies: CommentEntity[];

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  repliesCount: number;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
