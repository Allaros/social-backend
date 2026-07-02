import { LastMessagePreview } from '../types/chat.interface';

export const resolveLastMessageText = (
  lastMessage: LastMessagePreview,
): string | null => {
  if (lastMessage.text?.trim()) {
    return lastMessage.text;
  }

  const count = lastMessage.attachmentsCount;

  if (count > 0) {
    if (count === 1) {
      return '1 вложение';
    }

    if (count >= 2 && count <= 4) {
      return `${count} вложения`;
    }

    return `${count} вложений`;
  }

  return null;
};
