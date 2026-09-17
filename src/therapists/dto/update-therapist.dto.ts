import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MESSAGES,
  normalizeEmail,
  PHONE_REGEX,
} from '../../common/validation/rules';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Any subset of the editable fields. */
export class UpdateTherapistDto {
 
  @IsOptional()
  @Transform(trim)
  @IsString({ message: MESSAGES.name })
  @Length(2, 60, { message: MESSAGES.name })
  name?: string;


  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail({}, { message: MESSAGES.email })
  email?: string;


  @IsOptional()
  @Transform(trim)
  @Matches(PHONE_REGEX, { message: MESSAGES.phone })
  phone?: string;


  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: MESSAGES.experienceYears })
  @Min(0, { message: MESSAGES.experienceYears })
  @Max(50, { message: MESSAGES.experienceYears })
  experienceYears?: number;


  @IsOptional()
  @Transform(trim)
  @IsString({ message: MESSAGES.required })
  @IsNotEmpty({ message: MESSAGES.required })
  @MaxLength(120, { message: MESSAGES.required })
  specialization?: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: MESSAGES.required })
  @IsNotEmpty({ message: MESSAGES.required })
  @MaxLength(255, { message: MESSAGES.required })
  address?: string;
}
