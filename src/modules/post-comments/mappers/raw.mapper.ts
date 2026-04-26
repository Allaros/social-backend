/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export function normalizeCommentRaw(raw: any[]) {
  const map = new Map<number, any>();

  raw.forEach((r) => {
    const id = r.comment_id;

    map.set(id, {
      isLiked: r.isLiked === true || r.isLiked === 'true',
    });
  });

  return map;
}
