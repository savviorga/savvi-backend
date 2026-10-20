import { QueryFailedError } from 'typeorm';

/** `true` si el error de Postgres es una violación de índice único (23505). */
export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const err = error as QueryFailedError & {
    code?: string;
    driverError?: { code?: string };
  };
  return (err.code ?? err.driverError?.code) === '23505';
}
