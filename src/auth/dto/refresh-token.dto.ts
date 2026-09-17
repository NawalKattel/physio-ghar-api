import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MESSAGES } from '../../common/validation/rules';

export class RefreshTokenDto {

  @IsString({ message: MESSAGES.required })
  @IsNotEmpty({ message: MESSAGES.required })
  @MaxLength(200)
  refreshToken!: string;
}
