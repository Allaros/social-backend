import { UserEntity } from '@app/modules/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AuthProvider } from './types/Auth.interface';

@Entity('providers')
@Index(['provider', 'providerId'], { unique: true })
@Index(['user', 'provider'], { unique: true })
export class ProviderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: AuthProvider,
  })
  provider: AuthProvider;

  @Index()
  @Column({ length: 255 })
  providerId: string;

  @Index()
  @ManyToOne(() => UserEntity, (user) => user.providers, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
