import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { ProfileEntity } from '../profile.entity';
import { ProfileCounterField } from '../types/profile.interface';
import { CounterUpdater } from '@app/shared/database/counter-updater';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager
      ? manager.getRepository(ProfileEntity)
      : this.profileRepository;
  }

  create({
    name,
    userId,
    username,
    avatarUrl,
    manager,
  }: {
    userId: number;
    username: string;
    name: string;
    avatarUrl?: string;
    manager?: EntityManager;
  }) {
    const repo = this.getRepo(manager);

    return repo.create({
      userId,
      username,
      name,
      avatarUrl,
    });
  }

  async save(entity: ProfileEntity, manager?: EntityManager) {
    return await this.getRepo(manager).save(entity);
  }

  async findById(profileId: number) {
    return await this.profileRepository.findOne({ where: { id: profileId } });
  }

  async findByUsername(username: string) {
    return await this.profileRepository.findOne({ where: { username } });
  }

  async findMany(ids: number[]) {
    if (!ids.length) return [];

    return await this.profileRepository.find({
      where: { id: In(ids) },
      select: { id: true, username: true, name: true, avatarUrl: true },
    });
  }

  async updateCounters(
    profileId: number,
    updates: Partial<Record<ProfileCounterField, number>>,
  ) {
    await CounterUpdater.update(this.profileRepository, profileId, updates);
  }

  async updateCountersAndReturn<TField extends ProfileCounterField>(
    profileId: number,
    updates: Partial<Record<ProfileCounterField, number>>,
    returningFields: TField[],
  ) {
    return await CounterUpdater.updateAndReturn(
      this.profileRepository,
      profileId,
      updates,
      returningFields,
    );
  }

  async updateLastSeen(profileId: number) {
    await this.profileRepository.update(
      { id: profileId },
      { lastSeenAt: new Date() },
    );
  }
}
