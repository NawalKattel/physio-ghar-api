import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthenticatedTherapist,
  CurrentTherapist,
} from '../common/decorators/current-therapist.decorator';
import { ApiErrorDto } from '../common/errors/api-error.dto';
import { PageQueryDto } from '../common/pagination/pagination';
import { IdParamPipe } from '../common/pipes/id-param.pipe';
import { SessionListDto } from '../sessions/dto/session.dto';
import {
  ListPatientsQueryDto,
  PatientDetailDto,
  PatientListDto,
} from './dto/patient-responses.dto';
import { PatientsService } from './patients.service';

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  @ApiOkResponse({ type: PatientListDto })
  list(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Query() query: ListPatientsQueryDto,
  ): Promise<PatientListDto> {
    return this.patients.list(me.id, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: PatientDetailDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  get(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('id', IdParamPipe) id: string,
  ): Promise<PatientDetailDto> {
    return this.patients.get(me.id, id);
  }

  @Get(':id/sessions')
  @ApiOkResponse({ type: SessionListDto, description: 'Newest first' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  sessions(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('id', IdParamPipe) id: string,
    @Query() page: PageQueryDto,
  ): Promise<SessionListDto> {
    return this.patients.listSessions(me.id, id, page);
  }
}
