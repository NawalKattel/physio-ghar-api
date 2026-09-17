import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import {
  MESSAGES,
  normalizeEmail,
  PASSWORD_REGEX,
  PHONE_REGEX,
} from '../../common/validation/rules';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class RegisterDto {

  @Transform(trim)
  @IsString({ message: MESSAGES.name })
  @Length(2, 60, { message: MESSAGES.name })
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail({}, { message: MESSAGES.email })
  email!: string;


  @Transform(trim)
  @Matches(PHONE_REGEX, { message: MESSAGES.phone })
  phone!: string;


  @IsString({ message: MESSAGES.password })
  @MaxLength(128, { message: MESSAGES.password })
  @Matches(PASSWORD_REGEX, { message: MESSAGES.password })
  password!: string;
}
