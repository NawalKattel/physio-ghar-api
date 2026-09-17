import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { IsDateOnly, IsDateTimeWithOffset } from '../../common/validation/dates';

export class ListSlotsQueryDto {

  @IsDateOnly()
  from!: string;

  @IsDateOnly()
  to!: string;
}

export class CreateSlotDto {

  @IsDateTimeWithOffset()
  start!: string;


  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Duration must be whole minutes' })
  @Min(15, { message: 'Duration must be between 15 and 240 minutes' })
  @Max(240, { message: 'Duration must be between 15 and 240 minutes' })
  durationMinutes?: number;
}
