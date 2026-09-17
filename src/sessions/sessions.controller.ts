import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  AuthenticatedTherapist,
  CurrentTherapist,
} from '../common/decorators/current-therapist.decorator';
import { ApiErrorDto } from '../common/errors/api-error.dto';
import { IdParamPipe } from '../common/pipes/id-param.pipe';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import {
  CompleteSessionDto,
  CompleteSessionResponseDto,
  DeclineSessionDto,
  RescheduleSessionDto,
} from './dto/session-actions.dto';
import { SessionDto, SessionListDto } from './dto/session.dto';
import { SessionsService } from './sessions.service';

@ApiTags('Sessions')
@ApiBearerAuth()
@ApiNotFoundResponse({ type: ApiErrorDto, description: 'NOT_FOUND' })
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get()
  @ApiOkResponse({ type: SessionListDto })
  list(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Query() query: ListSessionsQueryDto,
  ): Promise<SessionListDto> {
    return this.sessions.list(me.id, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: SessionDto })
  get(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('id', IdParamPipe) id: string,
  ): Promise<SessionDto> {
    return this.sessions.get(me.id, id);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SessionDto })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'SESSION_INVALID_STATUS · SLOT_BOOKED' })
  @ApiUnprocessableEntityResponse({ type: ApiErrorDto, description: 'SLOT_IN_PAST' })
  accept(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('id', IdParamPipe) id: string,
  ): Promise<SessionDto> {
    return this.sessions.accept(me.id, id);
  }

  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SessionDto })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'SESSION_INVALID_STATUS' })
  decline(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('id', IdParamPipe) id: string,
    @Body() dto: DeclineSessionDto,
  ): Promise<SessionDto> {
    return this.sessions.decline(me.id, id, dto);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CompleteSessionResponseDto })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'SESSION_INVALID_STATUS' })
  @ApiUnprocessableEntityResponse({ type: ApiErrorDto, description: 'VALIDATION_FAILED' })
  complete(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('id', IdParamPipe) id: string,
    @Body() dto: CompleteSessionDto,
  ): Promise<CompleteSessionResponseDto> {
    return this.sessions.complete(me.id, id, dto.remarks);
  }

  @Post(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SessionDto })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'SESSION_INVALID_STATUS · SLOT_BOOKED' })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorDto,
    description: 'SLOT_IN_PAST · VALIDATION_FAILED (no open slot at that time)',
  })
  reschedule(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('id', IdParamPipe) id: string,
    @Body() dto: RescheduleSessionDto,
  ): Promise<SessionDto> {
    return this.sessions.reschedule(me.id, id, dto.start);
  }
}
