import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedTherapist,
  CurrentTherapist,
} from '../common/decorators/current-therapist.decorator';
import { DashboardDto, DashboardQueryDto } from './dashboard.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('me/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  /** Everything the home screen needs in one call. */
  @Get()
  @ApiOkResponse({ type: DashboardDto })
  get(
    @CurrentTherapist() me: AuthenticatedTherapist,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardDto> {
    return this.dashboard.get(me.id, query.date);
  }
}
