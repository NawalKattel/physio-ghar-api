import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../common/errors/api-exception';
import {
  DEFAULT_PAGE_SIZE,
  decodeCursor,
  encodeCursor,
  PageQueryDto,
} from '../common/pagination/pagination';
import { formatNullableInZone } from '../common/time/time';
import { Note } from '../notes/note.entity';
import { SessionDto, SessionListDto } from '../sessions/dto/session.dto';
import { Session } from '../sessions/session.entity';
import { SessionsService } from '../sessions/sessions.service';
import { TherapistsService } from '../therapists/therapists.service';
import {
  ListPatientsQueryDto,
  PatientDetailDto,
  PatientListDto,
} from './dto/patient-responses.dto';
import { PatientDto } from './dto/patient.dto';
import { Patient } from './patient.entity';

interface PatientSummaryRow {
  id: string;
  name: string;
  age: number;
  condition: string;
  last_session_at: Date | null;
}

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient) private readonly patients: Repository<Patient>,
    @InjectRepository(Session) private readonly sessionsRepo: Repository<Session>,
    @InjectRepository(Note) private readonly notes: Repository<Note>,
    private readonly sessions: SessionsService,
    private readonly therapists: TherapistsService,
  ) {}

  /** Only patients who have booked this therapist are visible. */
  async list(therapistId: string, query: ListPatientsQueryDto): Promise<PatientListDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const params: unknown[] = [therapistId];
    const conditions: string[] = [];

    if (query.query) {
      params.push(`%${query.query.replace(/[\\%_]/g, '\\$&')}%`);
      conditions.push(`p.name ILIKE $${params.length} ESCAPE '\\'`);
    }
    if (query.cursor) {
      const [name, id] = decodeCursor(query.cursor, 2);
      params.push(name, id);
      conditions.push(`(p.name, p.id) > ($${params.length - 1}, $${params.length}::uuid)`);
    }
    params.push(limit + 1);

    const rows: PatientSummaryRow[] = await this.patients.query(
      `SELECT p.id, p.name, p.age, p.condition,
              (SELECT max(s.start_at) FROM sessions s
                WHERE s.patient_id = p.id AND s.therapist_id = $1
                  AND s.status = 'completed') AS last_session_at
         FROM patients p
        WHERE EXISTS (SELECT 1 FROM sessions s
                       WHERE s.patient_id = p.id AND s.therapist_id = $1)
          ${conditions.map((c) => `AND ${c}`).join(' ')}
        ORDER BY p.name, p.id
        LIMIT $${params.length}`,
      params,
    );

    const items = rows.slice(0, limit);
    const last = items[items.length - 1];
    return {
      patients: items.map((r) => ({
        id: r.id,
        name: r.name,
        age: r.age,
        condition: r.condition,
        lastSessionAt: formatNullableInZone(r.last_session_at && new Date(r.last_session_at), tz),
      })),
      nextCursor: rows.length > limit ? encodeCursor([last.name, last.id]) : null,
    };
  }

  async get(therapistId: string, patientId: string): Promise<PatientDetailDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    const patient = await this.getVisible(therapistId, patientId);

    const [lastSession, sessionCount, noteCount] = await Promise.all([
      this.sessionsRepo.findOne({
        where: { therapistId, patientId, status: 'completed' },
        relations: { patient: true },
        order: { startAt: 'DESC' },
      }),
      this.sessionsRepo.countBy({ therapistId, patientId }),
      this.notes.countBy({ therapistId, patientId }),
    ]);

    return {
      ...PatientDto.from(patient),
      lastSession: lastSession ? SessionDto.from(lastSession, tz) : null,
      sessionCount,
      noteCount,
    };
  }

  async listSessions(
    therapistId: string,
    patientId: string,
    page: PageQueryDto,
  ): Promise<SessionListDto> {
    await this.getVisible(therapistId, patientId);
    return this.sessions.list(therapistId, {
      ...page,
      patientId,
      sort: 'start_desc',
    });
  }

  /** Returns the patient, or NOT_FOUND if they have never booked this therapist. */
  async getVisible(therapistId: string, patientId: string): Promise<Patient> {
    const patient = await this.patients
      .createQueryBuilder('p')
      .where('p.id = :patientId', { patientId })
      .andWhere(
        'EXISTS (SELECT 1 FROM sessions s WHERE s.patient_id = p.id AND s.therapist_id = :therapistId)',
        { therapistId },
      )
      .getOne();
    if (!patient) throw ApiException.notFound('Patient not found.');
    return patient;
  }
}
