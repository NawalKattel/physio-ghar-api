import { Body, Controller, Get, Patch, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  AuthenticatedTherapist,
  CurrentTherapist,
} from '../common/decorators/current-therapist.decorator';
import { ApiErrorDto } from '../common/errors/api-error.dto';
import { AvailabilityDto } from './dto/availability.dto';
import { TherapistDto } from './dto/therapist.dto';
import { UpdateTherapistDto } from './dto/update-therapist.dto';
import { TherapistsService } from './therapists.service';

@ApiTags('Therapist profile')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly therapists: TherapistsService) {}

  @Get()
  @ApiOkResponse({ type: TherapistDto })
  async get(@CurrentTherapist() me: AuthenticatedTherapist): Promise<TherapistDto> {
    return TherapistDto.from(await this.therapists.getSelf(me.id));
  }

  @Patch()
  @ApiOkResponse({ type: TherapistDto })
  @ApiUnprocessableEntityResponse({ type: ApiErrorDto, description: 'VALIDATION_FAILED' })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'EMAIL_TAKEN' })
  async update(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Body() dto: UpdateTherapistDto,
  ): Promise<TherapistDto> {
    return TherapistDto.from(await this.therapists.update(me.id, dto));
  }

  @Put('availability')
  @ApiOkResponse({ type: AvailabilityDto })
  async setAvailability(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Body() dto: AvailabilityDto,
  ): Promise<AvailabilityDto> {
    return {
      isAvailable: await this.therapists.setAvailable(me.id, dto.isAvailable),
    };
  }
}
