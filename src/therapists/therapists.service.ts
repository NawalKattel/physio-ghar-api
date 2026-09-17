import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ApiException, ErrorCode } from '../common/errors/api-exception';
import { normalizePhone } from '../common/validation/rules';
import { UpdateTherapistDto } from './dto/update-therapist.dto';
import { Therapist } from './therapist.entity';

@Injectable()
export class TherapistsService {
  constructor(
    @InjectRepository(Therapist)
    private readonly therapists: Repository<Therapist>,
  ) {}

  /** The signed-in therapist; a valid token for a deleted account is treated as signed out. */
  async getSelf(therapistId: string): Promise<Therapist> {
    const therapist = await this.therapists.findOneBy({ id: therapistId });
    if (!therapist) {
      throw new ApiException(
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        'Sign in to continue.',
      );
    }
    return therapist;
  }

  async getTimeZone(therapistId: string): Promise<string> {
    return (await this.getSelf(therapistId)).timeZone;
  }

  async update(therapistId: string, dto: UpdateTherapistDto): Promise<Therapist> {
    const therapist = await this.getSelf(therapistId);
    Object.assign(therapist, {
      ...dto,
      ...(dto.phone !== undefined && { phone: normalizePhone(dto.phone) }),
    });
    try {
      return await this.therapists.save(therapist);
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e.driverError as { constraint?: string }).constraint === 'uq_therapists_email'
      ) {
        throw new ApiException(
          ErrorCode.EMAIL_TAKEN,
          HttpStatus.CONFLICT,
          'That email already has an account.',
          { email: 'That email already has an account' },
        );
      }
      throw e;
    }
  }

  async setAvailable(therapistId: string, isAvailable: boolean): Promise<boolean> {
    const result = await this.therapists.update({ id: therapistId }, { isAvailable });
    if (!result.affected) await this.getSelf(therapistId);
    return isAvailable;
  }
}
