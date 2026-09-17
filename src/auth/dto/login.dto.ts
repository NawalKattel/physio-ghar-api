import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { MESSAGES, normalizeEmail } from '../../common/validation/rules';

export class LoginDto {
 
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail({}, { message: MESSAGES.email })
  email!: string;


  @IsString({ message: MESSAGES.required })
  @IsNotEmpty({ message: MESSAGES.required })
  @MaxLength(128)
  password!: string;
}
