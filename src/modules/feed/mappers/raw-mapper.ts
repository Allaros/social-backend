/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { RawFlags } from '../types/feed.interface';

function toBool(value: any): boolean {
  return value === true || value === 'true' || value === 1;
}

export function normalizeRaw(raw: any[]): Map<number, RawFlags> {
  const map = new Map<number, RawFlags>();

  for (const r of raw) {
    const postId = Number(r.post_id);
    if (!postId) continue;

    if (!map.has(postId)) {
      map.set(postId, {
        isOwned: toBool(r.isOwned ?? r.isowned),
        isLiked: toBool(r.isLiked ?? r.isliked),
        isSaved: toBool(r.isSaved ?? r.issaved),
      });
    }
  }

  return map;
}
