import { HttpException, HttpStatus } from '@nestjs/common';

export enum ErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_TAKEN = 'EMAIL_TAKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  SESSION_INVALID_STATUS = 'SESSION_INVALID_STATUS',
  SLOT_TAKEN = 'SLOT_TAKEN',
  SLOT_IN_PAST = 'SLOT_IN_PAST',
  SLOT_BOOKED = 'SLOT_BOOKED',
  INTERNAL = 'INTERNAL',
}

export interface ApiErrorBody {
  error: {
    code: ErrorCode | string;
    message: string;
    fields?: Record<string, string>;
  };
}

export class ApiException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    status: HttpStatus,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super({ error: { code, message, fields } } satisfies ApiErrorBody, status);
  }

  static validation(fields: Record<string, string>): ApiException {
    return new ApiException(
      ErrorCode.VALIDATION_FAILED,
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Some fields are invalid.',
      fields,
    );
  }

  static notFound(message = 'Not found.'): ApiException {
    return new ApiException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, message);
  }
}
