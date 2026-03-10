import { stopTestDB } from './test-db';

export default async () => {
  await stopTestDB();
};
