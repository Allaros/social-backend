import { ProfileEntity } from '@app/modules/profile/profile.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostEntity } from './post.entity';

@Entity('saved_posts')
export class SavedPostEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProfileEntity, (profile) => profile.savedPosts, {
    onDelete: 'CASCADE',
  })
  profile: ProfileEntity;

  @ManyToOne(() => PostEntity, (post) => post.savedBy, { onDelete: 'CASCADE' })
  post: PostEntity;

  @CreateDateColumn()
  createdAt: Date;
}
