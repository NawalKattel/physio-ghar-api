import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../common/errors/api-exception';
import { applyKeyset, PageQueryDto, toPage } from '../common/pagination/pagination';
import { PatientsService } from '../patients/patients.service';
import { TherapistsService } from '../therapists/therapists.service';
import { NoteBodyDto } from './dto/note-requests.dto';
import { NoteDto, NoteListDto } from './dto/note.dto';
import { Note } from './note.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private readonly notes: Repository<Note>,
    private readonly patients: PatientsService,
    private readonly therapists: TherapistsService,
  ) {}

  /** Newest first; includes notes created from session remarks. */
  async list(therapistId: string, patientId: string, page: PageQueryDto): Promise<NoteListDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    await this.patients.getVisible(therapistId, patientId);

    const qb = this.notes
      .createQueryBuilder('n')
      .where('n.patientId = :patientId', { patientId })
      .andWhere('n.therapistId = :therapistId', { therapistId });
    applyKeyset(qb, {
      sortColumn: 'n.createdAt',
      idColumn: 'n.id',
      direction: 'DESC',
      page,
      sortCast: 'timestamptz',
    });

    const { items, nextCursor } = toPage(await qb.getMany(), page, (n) => [
      n.createdAt.toISOString(),
      n.id,
    ]);
    return { notes: items.map((n) => NoteDto.from(n, tz)), nextCursor };
  }

  async create(therapistId: string, patientId: string, dto: NoteBodyDto): Promise<NoteDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    await this.patients.getVisible(therapistId, patientId);
    const note = await this.notes.save(
      this.notes.create({
        therapistId,
        patientId,
        title: dto.title,
        body: dto.body,
        sessionId: null,
        updatedAt: null,
      }),
    );
    return NoteDto.from(note, tz);
  }

  /** Only the author can edit; anyone else gets NOT_FOUND. */
  async update(
    therapistId: string,
    patientId: string,
    noteId: string,
    dto: NoteBodyDto,
  ): Promise<NoteDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    const note = await this.notes.findOneBy({ id: noteId, patientId, therapistId });
    if (!note) throw ApiException.notFound('Note not found.');

    note.title = dto.title;
    note.body = dto.body;
    note.updatedAt = new Date();
    return NoteDto.from(await this.notes.save(note), tz);
  }
}
