import { IsBoolean } from 'class-validator';

export class AvailabilityDto {
  /** While false, the therapist takes no new booking requests. */
  @IsBoolean({ message: 'isAvailable must be true or false' })
  isAvailable!: boolean;
}
