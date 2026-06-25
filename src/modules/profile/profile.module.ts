import { Module } from '@nestjs/common';
import { ProfileService } from './services/profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileEntity } from './entities/profile.entity';
import { FileModule } from '../file/file.module';
import { ProfileCounterUpdateListener } from './listeners/profile-counter-update.listener';
import { FindProfilesUseCase } from './use-cases/find-profiles.usecase';
import { ProfileQueryService } from './services/profile-query.service';
import { ProfileResponseBuilder } from './builders/profile-response.builder';
import { GetProfileByUsernameUseCase } from './use-cases/get-profile-by-username.usecase';
import { CreateProfileUseCase } from './use-cases/create-profile.usecase';
import { UpdateProfileUseCase } from './use-cases/update-profile.usecase';
import { ReplaceAvatarUseCase } from './use-cases/replace-avatar.usecase';
import { ProfileStatusListener } from './listeners/profile-status.listener';
import { WebsocketModule } from '../websocket/websocket.module';
import { GetRelationsUseCase } from './use-cases/get-relations.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileEntity]),
    FileModule,
    WebsocketModule,
  ],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    ProfileCounterUpdateListener,
    FindProfilesUseCase,
    ProfileQueryService,
    ProfileResponseBuilder,
    GetProfileByUsernameUseCase,
    CreateProfileUseCase,
    UpdateProfileUseCase,
    ReplaceAvatarUseCase,
    ProfileStatusListener,
    GetRelationsUseCase,
  ],
  exports: [
    ProfileService,
    FindProfilesUseCase,
    CreateProfileUseCase,
    ProfileQueryService,
    ProfileResponseBuilder,
  ],
})
export class ProfileModule {}
