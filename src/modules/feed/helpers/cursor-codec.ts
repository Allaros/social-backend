import { CursorCodec } from '@app/shared/cursor/codec/cursor-codec';
import { FeedCursor } from '../types/feed.interface';

export const feedCursorCodec = new CursorCodec<FeedCursor>(['createdAt', 'id']);
