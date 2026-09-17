import { Transform } from 'class-transformer';
import { IsIn, IsString, Length } from 'class-validator';
import { COMPLAINT_CATEGORIES, type ComplaintCategory } from '../complaint.entity';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateComplaintDto {

  @IsIn(COMPLAINT_CATEGORIES, { message: 'Choose a category' })
  category: ComplaintCategory;


  @Transform(trim)
  @IsString({ message: 'Subject must be at least 5 characters' })
  @Length(5, 80, { message: 'Subject must be at least 5 characters' })
  subject: string;


  @Transform(trim)
  @IsString({ message: 'Description must be at least 20 characters' })
  @Length(20, 1000, { message: 'Description must be at least 20 characters' })
  description: string;
}
