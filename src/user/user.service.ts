import { Injectable } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { UserResponse } from './types/User.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(email: string, passwordHash?: string): Promise<UserEntity> {
    const normalizedEmail = email.toLowerCase().trim();

    const newUser = this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
    });

    return await this.userRepository.save(newUser);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    return user;
  }

  buildUserResponse(response: UserEntity): UserResponse {
    return {
      email: response.email,
      id: response.id,
      isVerified: response.isVerified,
    };
  }
}
