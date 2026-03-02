import { UserEntity } from '@app/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

@Entity('providers')
export class ProviderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  provider: string;

  @Column()
  providerId: string;

  @ManyToOne(() => UserEntity, (user) => user.providers, {
    onDelete: 'CASCADE',
  })
  users: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
