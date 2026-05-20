export const SELF_CHAT_KEY_PREFIX = 'self';

export function buildDirectChatKey(
  firstProfileId: number,
  secondProfileId: number,
) {
  const [a, b] = [firstProfileId, secondProfileId].sort((x, y) => x - y);

  return `user:${a}:user:${b}`;
}

export function buildSelfChatKey(profileId: number) {
  return `self:${profileId}`;
}
