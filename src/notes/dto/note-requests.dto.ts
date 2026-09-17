import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class NoteBodyDto {

  @Transform(trim)
  @IsString({ message: 'Give the note a title' })
  @IsNotEmpty({ message: 'Give the note a title' })
  @MaxLength(80, { message: 'Give the note a title' })
  title: string;

  @Transform(trim)
  @IsString({ message: 'Please write a note' })
  @IsNotEmpty({ message: 'Please write a note' })
  @MaxLength(2000, { message: 'Please write a note' })
  body: string;
}
