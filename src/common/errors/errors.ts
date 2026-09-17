import { HttpStatus } from '@nestjs/common';
import { ApiException, ErrorCode } from './api-exception';

// Domain errors shared by several modules.

export const slotTaken = () =>
  new ApiException(
    ErrorCode.SLOT_TAKEN,
    HttpStatus.CONFLICT,
    'A slot already exists at this time.',
    { start: 'A slot already exists at this time' },
  );

export const slotInPast = () =>
  new ApiException(
    ErrorCode.SLOT_IN_PAST,
    HttpStatus.UNPROCESSABLE_ENTITY,
    'This time has already passed.',
    { start: 'This time has already passed' },
  );

export const slotBooked = (message = 'This time is already booked.') =>
  new ApiException(ErrorCode.SLOT_BOOKED, HttpStatus.CONFLICT, message);

export const invalidSessionStatus = (message: string) =>
  new ApiException(
    ErrorCode.SESSION_INVALID_STATUS,
    HttpStatus.CONFLICT,
    message,
  );
