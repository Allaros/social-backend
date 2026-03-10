import { QueryFailedError } from 'typeorm';

export function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    error instanceof QueryFailedError && error.driverError?.code === '23505'
  );
}
