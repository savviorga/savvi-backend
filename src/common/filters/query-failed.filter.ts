import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

/** Errores de Postgres que son culpa de los datos enviados, no del servidor. */
const CLIENT_ERRORS: Record<string, { status: number; message: string }> = {
  // invalid_text_representation: p. ej. un id que no es UUID.
  '22P02': {
    status: HttpStatus.BAD_REQUEST,
    message: 'Algún identificador o valor no tiene un formato válido.',
  },
  // unique_violation
  '23505': {
    status: HttpStatus.CONFLICT,
    message: 'Ya existe un registro con esos datos.',
  },
  // foreign_key_violation: referencia a algo que no existe o que está en uso.
  '23503': {
    status: HttpStatus.CONFLICT,
    message:
      'El registro está relacionado con otros datos (no existe o está en uso).',
  },
  // check_violation
  '23514': {
    status: HttpStatus.BAD_REQUEST,
    message: 'Algún valor no es válido.',
  },
};

/**
 * Traduce errores de la base de datos causados por datos inválidos a 400/409
 * con un mensaje claro. El resto sigue siendo 500 (y se registra).
 */
@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  private readonly logger = new Logger(QueryFailedFilter.name);

  catch(error: QueryFailedError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const err = error as QueryFailedError & {
      code?: string;
      driverError?: { code?: string };
    };
    const known = CLIENT_ERRORS[err.code ?? err.driverError?.code ?? ''];

    if (!known) {
      this.logger.error(error.message, error.stack);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error interno del servidor',
        error: 'Internal Server Error',
      });
      return;
    }

    response.status(known.status).json({
      statusCode: known.status,
      message: known.message,
      error: known.status === HttpStatus.CONFLICT ? 'Conflict' : 'Bad Request',
    });
  }
}
