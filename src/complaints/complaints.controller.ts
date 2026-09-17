import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
import { ComplaintsService } from './complaints.service';
import { ComplaintDto, ComplaintListDto } from './dto/complaint.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';

@ApiTags('Complaints')
@ApiBearerAuth()
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Get()
  @ApiOkResponse({ type: ComplaintListDto, description: 'Newest first' })
  list(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Query() page: PageQueryDto,
  ): Promise<ComplaintListDto> {
    return this.complaints.list(me.id, page);
  }

  @Post()
  @ApiCreatedResponse({ type: ComplaintDto })
  @ApiUnprocessableEntityResponse({ type: ApiErrorDto, description: 'VALIDATION_FAILED' })
  create(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Body() dto: CreateComplaintDto,
  ): Promise<ComplaintDto> {
    return this.complaints.create(me.id, dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: ComplaintDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  get(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('id', IdParamPipe) id: string,
  ): Promise<ComplaintDto> {
    return this.complaints.get(me.id, id);
  }
}
