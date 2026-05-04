import { forwardRef, Module } from '@nestjs/common';
import { ProfileService } from './services/profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileEntity } from './profile.entity';
import { FileModule } from '../file/file.module';
import { ProfileCounterUpdateListener } from './listeners/profile-counter-update.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileEntity]),
    forwardRef(() => FileModule),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileCounterUpdateListener],
  exports: [ProfileService],
})
export class ProfileModule {}
