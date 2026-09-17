import { formatInZone } from '../../common/time/time';
import {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
} from '../complaint.entity';

export class ComplaintDto {
  id: string;

  reference: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  status: ComplaintStatus;
  submittedAt: string;

  static from(c: Complaint, tz: string): ComplaintDto {
    return {
      id: c.id,
      reference: c.reference,
      category: c.category,
      subject: c.subject,
      description: c.description,
      status: c.status,
      submittedAt: formatInZone(c.submittedAt, tz),
    };
  }
}

export class ComplaintListDto {
  complaints: ComplaintDto[];
  nextCursor: string | null;
}
