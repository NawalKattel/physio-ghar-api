import { IsOptional } from 'class-validator';
import { IsDateOnly } from '../common/validation/dates';
import { SessionDto } from '../sessions/dto/session.dto';

export class DashboardQueryDto {

  @IsOptional()
  @IsDateOnly()
  date?: string;
}

export class DashboardSummaryDto {

  todaySessions: number;

  pendingRequests: number;

  completedSessions: number;
}

export class DashboardDto {
  date: string;
  summary: DashboardSummaryDto;

  today: SessionDto[];

  upcoming: SessionDto[];
  isAvailable: boolean;
}
