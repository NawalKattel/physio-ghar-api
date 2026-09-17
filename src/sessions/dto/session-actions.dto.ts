import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { NoteDto } from '../../notes/dto/note.dto';
import { IsDateTimeWithOffset } from '../../common/validation/dates';
import { SessionDto } from './session.dto';

const trim = ({ value }:{ value:unknown }) =>
  typeof value === 'string' ? value.trim() !:value;

export class DeclineSessionDto {

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500, { message:'Keep the reason under 500 characters' })
  reason?:string;
}

export class CompleteSessionDto {

  @Transform(trim)
  @IsString({ message:'Add remarks before completing' })
  @IsNotEmpty({ message:'Add remarks before completing' })
  @MaxLength(2000, { message:'Keep remarks under 2000 characters' })
  remarks!:string;
}

export class RescheduleSessionDto {

  @IsDateTimeWithOffset()
  start!:string;
}

export class CompleteSessionResponseDto {
  session!:SessionDto;

  note!:NoteDto;
}
