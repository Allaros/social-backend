import 'tsconfig-paths/register';
import { startTestDB } from './test-db';

export default async () => {
  await startTestDB();

  const { AppDataSource } = await import('../../src/data-source');

  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();
};
