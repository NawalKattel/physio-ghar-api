import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { PageQueryDto } from '../common/pagination/pagination';
import { IdParamPipe } from '../common/pipes/id-param.pipe';
import { NoteBodyDto } from './dto/note-requests.dto';
import { NoteDto, NoteListDto } from './dto/note.dto';
import { NotesService } from './notes.service';

@ApiTags('Notes')
@ApiBearerAuth()
@ApiNotFoundResponse({ type: ApiErrorDto })
@Controller('patients/:id/notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  @ApiOkResponse({ type: NoteListDto, description: 'Newest first' })
  list(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('id', IdParamPipe) patientId: string,
    @Query() page: PageQueryDto,
  ): Promise<NoteListDto> {
    return this.notes.list(me.id, patientId, page);
  }

  @Post()
  @ApiCreatedResponse({ type: NoteDto })
  @ApiUnprocessableEntityResponse({ type: ApiErrorDto, description: 'VALIDATION_FAILED' })
  create(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('id', IdParamPipe) patientId: string,
    @Body() dto: NoteBodyDto,
  ): Promise<NoteDto> {
    return this.notes.create(me.id, patientId, dto);
  }

  @Patch(':noteId')
  @ApiOkResponse({ type: NoteDto })
  @ApiUnprocessableEntityResponse({ type: ApiErrorDto, description: 'VALIDATION_FAILED' })
  update(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('id', IdParamPipe) patientId: string,
    @Param('noteId', IdParamPipe) noteId: string,
    @Body() dto: NoteBodyDto,
  ): Promise<NoteDto> {
    return this.notes.update(me.id, patientId, noteId, dto);
  }
}
