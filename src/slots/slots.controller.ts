import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
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
import { SlotDaysDto, SlotDto } from './dto/slot.dto';
import { CreateSlotDto, ListSlotsQueryDto } from './dto/slot-requests.dto';
import { SlotsService } from './slots.service';

@ApiTags('Schedule and slots')
@ApiBearerAuth()
@Controller('slots')
export class SlotsController {
  constructor(private readonly slots: SlotsService) {}

  @Get()
  @ApiOkResponse({ type: SlotDaysDto })
  @ApiUnprocessableEntityResponse({ type: ApiErrorDto, description: 'VALIDATION_FAILED' })
  list(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Query() query: ListSlotsQueryDto,
  ): Promise<SlotDaysDto> {
    return this.slots.listDays(me.id, query);
  }

  @Post()
  @ApiCreatedResponse({ type: SlotDto })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'SLOT_TAKEN' })
  @ApiUnprocessableEntityResponse({ type: ApiErrorDto, description: 'SLOT_IN_PAST · VALIDATION_FAILED' })
  create(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Body() dto: CreateSlotDto,
  ): Promise<SlotDto> {
    return this.slots.create(me.id, dto);
  }

  @Post(':slotId/block')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SlotDto })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'SLOT_BOOKED' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  block(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('slotId', IdParamPipe) slotId: string,
  ): Promise<SlotDto> {
    return this.slots.block(me.id, slotId);
  }

  @Post(':slotId/unblock')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SlotDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  unblock(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('slotId', IdParamPipe) slotId: string,
  ): Promise<SlotDto> {
    return this.slots.unblock(me.id, slotId);
  }

  @Delete(':slotId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiConflictResponse({ type: ApiErrorDto, description: 'SLOT_BOOKED' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async remove(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Param('slotId', IdParamPipe) slotId: string,
  ): Promise<void> {
    await this.slots.remove(me.id, slotId);
  }
}
