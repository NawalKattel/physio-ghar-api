import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PageQueryDto } from '../../common/pagination/pagination';
import { IsDateOnly } from '../../common/validation/dates';
import { SESSION_STATUSES, type SessionStatus } from '../session.entity';

export const SESSION_SORTS = ['start_asc', 'start_desc'] as const;
export type SessionSort = (typeof SESSION_SORTS)[number];

export class ListSessionsQueryDto extends PageQueryDto {

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined
      ? undefined
      : ([] as unknown[])
          .concat(value)
          .flatMap((v) => String(v).split(','))
          .map((v) => v.trim())
          .filter(Boolean),
  )
  @IsIn(SESSION_STATUSES, {
    each: true,
    message: 'status must be request, upcoming, completed or cancelled',
  })
  status?: SessionStatus[];

 
  @IsOptional()
  @IsDateOnly()
  from?: string;


  @IsOptional()
  @IsDateOnly()
  to?: string;

  @IsOptional()
  @IsUUID('all', { message: 'patientId is not valid' })
  patientId?: string;


  @IsOptional()
  @IsIn(SESSION_SORTS, { message: 'sort must be start_asc or start_desc' })
  sort?: SessionSort;
}
