import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { ProviderEntity } from '@app/modules/auth/provider.entity';
import { ProfileEntity } from '@app/modules/profile/profile.entity';
import { VerificationEntity } from '@app/modules/verification/verification.entity';
import { SessionEntity } from '../auth/session.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProviderEntity, (provider) => provider.user)
  providers: ProviderEntity[];

  @OneToMany(() => SessionEntity, (token) => token.user)
  sessions: SessionEntity[];

  @OneToMany(() => VerificationEntity, (v) => v.user)
  verifications: VerificationEntity[];

  @OneToOne(() => ProfileEntity, (profile) => profile.user)
  profile: ProfileEntity;
}
