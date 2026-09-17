// Swagger shape of the error body produced by ApiExceptionFilter.

export class ApiErrorDetailDto {
  /** @example VALIDATION_FAILED */
  code: string;
  /** @example Some fields are invalid. */
  message: string;
  /** Per-field messages. @example { "email": "Enter a valid email address" } */
  fields?: Record<string, string>;
}

export class ApiErrorDto {
  error: ApiErrorDetailDto;
}
