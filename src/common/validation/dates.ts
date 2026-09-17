import { applyDecorators } from '@nestjs/common';
import { Matches } from 'class-validator';

export const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** Datetime with an explicit offset; values without one are ambiguous. */
export const DATETIME_WITH_OFFSET_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

export const IsDateOnly = (message = 'Use the format YYYY-MM-DD') =>
  applyDecorators(Matches(DATE_REGEX, { message }));

export const IsDateTimeWithOffset = (
  message = 'Use an ISO 8601 date and time with an offset',
) => applyDecorators(Matches(DATETIME_WITH_OFFSET_REGEX, { message }));
