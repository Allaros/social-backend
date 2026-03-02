import { ProviderEntity } from '@app/auth/provider.entity';
import { VerificationEntity } from '@app/verification/verification.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => VerificationEntity, (ev) => ev.user)
  emailVerifications: VerificationEntity[];

  @OneToMany(() => ProviderEntity, (provider) => provider.users)
  providers: ProviderEntity[];
}
