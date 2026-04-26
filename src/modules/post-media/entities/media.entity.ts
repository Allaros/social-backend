import { PostEntity } from '@app/modules/post/entities/post.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type MediaType = 'image' | 'video' | 'audio' | 'file';

@Entity('post_media')
export class PostMediaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @ManyToOne(() => PostEntity, (post) => post.media, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 20 })
  type: MediaType;

  @Column({ type: 'text', nullable: true })
  previewUrl?: string;

  @Column({ type: 'int', nullable: true })
  size?: number;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
