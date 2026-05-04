import { QueryFailedError } from 'typeorm';

export enum PostgresErrorCode {
  UNIQUE_VIOLATION = '23505',
}

type PostgresDriverError = {
  code?: string;
};

export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const driverError = error.driverError as PostgresDriverError;

  return driverError.code === PostgresErrorCode.UNIQUE_VIOLATION;
}
