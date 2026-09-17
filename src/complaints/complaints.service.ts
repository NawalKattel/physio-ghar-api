import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../common/errors/api-exception';
import { applyKeyset, PageQueryDto, toPage } from '../common/pagination/pagination';
import { TherapistsService } from '../therapists/therapists.service';
import { Complaint } from './complaint.entity';
import { ComplaintDto, ComplaintListDto } from './dto/complaint.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint) private readonly complaints: Repository<Complaint>,
    private readonly therapists: TherapistsService,
  ) {}

  async list(therapistId: string, page: PageQueryDto): Promise<ComplaintListDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    const qb = this.complaints
      .createQueryBuilder('c')
      .where('c.therapistId = :therapistId', { therapistId });
    applyKeyset(qb, {
      sortColumn: 'c.submittedAt',
      idColumn: 'c.id',
      direction: 'DESC',
      page,
      sortCast: 'timestamptz',
    });

    const { items, nextCursor } = toPage(await qb.getMany(), page, (c) => [
      c.submittedAt.toISOString(),
      c.id,
    ]);
    return { complaints: items.map((c) => ComplaintDto.from(c, tz)), nextCursor };
  }

  async get(therapistId: string, id: string): Promise<ComplaintDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    const complaint = await this.complaints.findOneBy({ id, therapistId });
    if (!complaint) throw ApiException.notFound('Complaint not found.');
    return ComplaintDto.from(complaint, tz);
  }

  async create(therapistId: string, dto: CreateComplaintDto): Promise<ComplaintDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    const { id } = await this.complaints.save(
      this.complaints.create({ therapistId, ...dto, status: 'submitted' }),
    );
    // Reload to pick up the sequence-generated reference.
    return ComplaintDto.from(await this.complaints.findOneByOrFail({ id }), tz);
  }
}
