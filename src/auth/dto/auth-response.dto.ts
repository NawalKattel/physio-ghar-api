import { TherapistDto } from '../../therapists/dto/therapist.dto';

export class TokenPairDto {
  accessToken!: string;

  refreshToken!: string;

  expiresIn!: number;
}

export class AuthResponseDto extends TokenPairDto {
  therapist!: TherapistDto;
}
