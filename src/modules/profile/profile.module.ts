import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileEntity } from './profile.entity';
import { FileModule } from '../file/file.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileEntity]), FileModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
