import { ProfileEntity } from '@app/modules/profile/entities/profile.entity';

export class ChatSystemMessages {
  private static getDisplayName(profile: ProfileEntity) {
    return profile.name ?? profile.username;
  }

  static memberLeft(profile: ProfileEntity) {
    return `${this.getDisplayName(profile)} покинул чат`;
  }

  static memberJoined(profile: ProfileEntity) {
    return `${this.getDisplayName(profile)} присоединился к чату`;
  }

  static memberAdded(actor: ProfileEntity, target: ProfileEntity) {
    return `${this.getDisplayName(actor)} добавил пользователя ${this.getDisplayName(target)}`;
  }

  static memberKicked(
    actor: ProfileEntity,
    target: ProfileEntity,
    restrictedUntil: Date | null,
  ) {
    const actorName = this.getDisplayName(actor);
    const targetName = this.getDisplayName(target);

    if (!restrictedUntil) {
      return `${actorName} исключил пользователя ${targetName} навсегда`;
    }

    const date = restrictedUntil.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${actorName} заблокировал пользователя ${targetName} до ${date}`;
  }

  static memberBanned(actor: ProfileEntity, target: ProfileEntity) {
    return `${this.getDisplayName(actor)} заблокировал пользователя ${this.getDisplayName(target)}`;
  }

  static memberUnbanned(actor: ProfileEntity, target: ProfileEntity) {
    return `${this.getDisplayName(actor)} разблокировал пользователя ${this.getDisplayName(target)}`;
  }

  static ownerTransferred(actor: ProfileEntity, target: ProfileEntity) {
    return `${this.getDisplayName(actor)} передал права владельца пользователю ${this.getDisplayName(target)}`;
  }

  static chatRenamed(actor: ProfileEntity, title: string) {
    return `${this.getDisplayName(actor)} изменил название чата на «${title}»`;
  }
}
