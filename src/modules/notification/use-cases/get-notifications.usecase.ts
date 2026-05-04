import { Injectable } from '@nestjs/common';
import { NotificationQueryService } from '../services/notification-query.service';
import { CursorCodec } from '@app/shared/cursor/codec/cursor-codec';
import { NotificationCursor } from '../types/notification.interface';
import { CursorConfig } from '@app/shared/cursor/types/cursor.interface';
import { PaginationExecutor } from '@app/shared/cursor/helpers/pagination-executor';
import { ProfileService } from '@app/modules/profile/services/profile.service';
import { NotificationResponseBuilder } from '../builders/notification-response-builder';

@Injectable()
export class GetNotificationsUseCase {
  private readonly codec = new CursorCodec<NotificationCursor>([
    'createdAt',
    'id',
  ]);
  constructor(
    private readonly notificationQueryService: NotificationQueryService,
    private readonly profileService: ProfileService,
    private readonly responseBuilder: NotificationResponseBuilder,
  ) {}

  async execute({
    receiverId,
    cursor,
  }: {
    receiverId: number;
    cursor?: string;
  }) {
    const decodedCursor = this.codec.decode(cursor);

    const qb = this.notificationQueryService.buildNotificationQuery({
      receiverId,
      cursor: decodedCursor,
    });

    const config: CursorConfig<NotificationCursor> = {
      fields: ['createdAt', 'id'],
      order: 'DESC',
    };

    const result = await PaginationExecutor.paginate(
      qb,
      10,
      config,
      (notification) => ({
        createdAt: notification.createdAt.getTime(),
        id: notification.id,
      }),
      this.codec,
    );

    const aggregatedActorIds = [
      ...new Set(
        result.data.flatMap(
          (notification) =>
            notification.metadata?.aggregatedActors?.map((a) => a.actorId) ??
            [],
        ),
      ),
    ];

    const aggregatedActors =
      await this.profileService.findMany(aggregatedActorIds);

    return this.responseBuilder.buildFeed({
      aggregatedActors,
      nextCursor: result.nextCursor,
      notifications: result.data,
    });
  }
}
