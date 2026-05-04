import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowsEntity } from './entities/follows.entity';
import { FollowsService } from './services/follows.service';
import { FollowsController } from './controllers/follows.controller';
import { CreateFollowingUseCase } from './use-cases/create-following.usecase';
import { RemoveFollowingUseCase } from './use-cases/remove-following.usecase';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [TypeOrmModule.forFeature([FollowsEntity]), ProfileModule],
  controllers: [FollowsController],
  providers: [FollowsService, CreateFollowingUseCase, RemoveFollowingUseCase],
})
export class FollowsModule {}
