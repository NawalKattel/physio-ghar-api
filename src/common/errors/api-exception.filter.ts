import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ApiErrorBody, ApiException, ErrorCode } from './api-exception';
import { slotBooked, slotTaken } from './errors';

const UNIQUE_CONSTRAINT_ERRORS: Record<string, () => ApiException> = {
  uq_slots_therapist_start: slotTaken,
  uq_sessions_booked_start: slotBooked,
};

const STATUS_CODES: Partial<Record<number, ErrorCode>> = {
  400: ErrorCode.BAD_REQUEST,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  422: ErrorCode.VALIDATION_FAILED,
  429: ErrorCode.RATE_LIMITED,
};

// Every error leaves the API as { error: { code, message, fields? } }.
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const [status, body] = this.toBody(exception);
    res.status(status).json(body);
  }

  private toBody(exception: unknown): [number, ApiErrorBody] {
    if (exception instanceof ApiException) {
      return [exception.getStatus(), exception.getResponse() as ApiErrorBody];
    }

    if (exception instanceof QueryFailedError) {
      const mapped = this.fromUniqueViolation(exception);
      if (mapped) return [mapped.getStatus(), mapped.getResponse() as ApiErrorBody];
    }

    if (exception instanceof ThrottlerException) {
      return [
        HttpStatus.TOO_MANY_REQUESTS,
        {
          error: {
            code: ErrorCode.RATE_LIMITED,
            message: 'Too many requests. Try again shortly.',
          },
        },
      ];
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : typeof (response as { message?: unknown }).message === 'string'
            ? (response as { message: string }).message
            : exception.message;
      return [
        status,
        { error: { code: STATUS_CODES[status] ?? ErrorCode.INTERNAL, message } },
      ];
    }

    // Log only the stack; never request bodies or SQL parameters (patient data).
    this.logger.error(exception instanceof Error ? exception.stack : exception);
    return [
      HttpStatus.INTERNAL_SERVER_ERROR,
      { error: { code: ErrorCode.INTERNAL, message: 'Something went wrong.' } },
    ];
  }

  /** Races lost at the database (two requests for one time) surface as domain errors. */
  private fromUniqueViolation(e: QueryFailedError): ApiException | null {
    const driverError = e.driverError as { code?: string; constraint?: string };
    if (driverError.code !== '23505') return null;
    const factory = UNIQUE_CONSTRAINT_ERRORS[driverError.constraint ?? ''];
    return factory ? factory() : null;
  }
}
