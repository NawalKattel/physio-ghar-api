import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../common/pagination/pagination';
import { SessionDto } from '../../sessions/dto/session.dto';
import { PatientDto } from './patient.dto';

export class ListPatientsQueryDto extends PageQueryDto {

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(60)
  query?: string;
}

export class PatientSummaryDto {
  id: string;
  name: string;
  age: number;
  condition: string;

  lastSessionAt: string | null;
}

export class PatientListDto {
  patients: PatientSummaryDto[];
  nextCursor: string | null;
}

export class PatientDetailDto extends PatientDto {

  lastSession: SessionDto | null;
  sessionCount: number;
  noteCount: number;
}
