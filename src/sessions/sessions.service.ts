import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Not, Repository } from 'typeorm';
import { ApiException } from '../common/errors/api-exception';
import { slotBooked, slotInPast } from '../common/errors/errors';
import { applyKeyset, toPage } from '../common/pagination/pagination';
import { addDays, startOfLocalDay } from '../common/time/time';
import { NoteDto } from '../notes/dto/note.dto';
import { Note } from '../notes/note.entity';
import { Slot } from '../slots/slot.entity';
import { TherapistsService } from '../therapists/therapists.service';
import {
  CompleteSessionResponseDto,
  DeclineSessionDto,
} from './dto/session-actions.dto';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import { SessionDto, SessionListDto } from './dto/session.dto';
import { transition } from './session-status';
import { BOOKED_STATUSES, Session } from './session.entity';

const SESSION_NOTE_TITLE = 'Session Note';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly therapists: TherapistsService,
  ) {}

  async list(therapistId: string, query: ListSessionsQueryDto): Promise<SessionListDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    const qb = this.sessions
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.patient', 'p')
      .where('s.therapistId = :therapistId', { therapistId });

    if (query.status?.length) {
      qb.andWhere('s.status IN (:...statuses)', { statuses: query.status });
    }
    if (query.from) {
      qb.andWhere('s.startAt >= :from', { from: startOfLocalDay(query.from, tz) });
    }
    if (query.to) {
      qb.andWhere('s.startAt < :to', { to: startOfLocalDay(addDays(query.to, 1), tz) });
    }
    if (query.patientId) {
      qb.andWhere('s.patientId = :patientId', { patientId: query.patientId });
    }

    applyKeyset(qb, {
      sortColumn: 's.startAt',
      idColumn: 's.id',
      direction: this.sortDirection(query),
      page: query,
      sortCast: 'timestamptz',
    });

    const { items, nextCursor } = toPage(await qb.getMany(), query, (s) => [
      s.startAt.toISOString(),
      s.id,
    ]);
    return { sessions: items.map((s) => SessionDto.from(s, tz)), nextCursor };
  }

  async get(therapistId: string, id: string): Promise<SessionDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    const session = await this.sessions.findOne({
      where: { id, therapistId },
      relations: { patient: true },
    });
    if (!session) throw ApiException.notFound('Session not found.');
    return SessionDto.from(session, tz);
  }

  async accept(therapistId: string, id: string): Promise<SessionDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    return this.dataSource.transaction(async (m) => {
      const session = await this.lock(m, therapistId, id);
      const status = transition(session.status, 'accept');
      if (session.startAt <= new Date()) throw slotInPast();

      await this.assertBookable(m, therapistId, session.startAt, id, () =>
        slotBooked('This time is no longer available.'),
      );
      // The partial unique index settles any race that slips past the check above.
      await m.update(Session, { id }, { status });
      return SessionDto.from(await this.reload(m, id), tz);
    });
  }

  async decline(
    therapistId: string,
    id: string,
    dto: DeclineSessionDto,
  ): Promise<SessionDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    return this.dataSource.transaction(async (m) => {
      const session = await this.lock(m, therapistId, id);
      const status = transition(session.status, 'decline');
      await m.update(Session, { id }, { status, declineReason: dto.reason || null });
      return SessionDto.from(await this.reload(m, id), tz);
    });
  }

  /** Completes the session and records its remarks as a patient note, atomically. */
  async complete(
    therapistId: string,
    id: string,
    remarks: string,
  ): Promise<CompleteSessionResponseDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    return this.dataSource.transaction(async (m) => {
      const session = await this.lock(m, therapistId, id);
      const status = transition(session.status, 'complete');

      await m.update(Session, { id }, { status, remarks });
      const note = await m.save(
        m.create(Note, {
          therapistId,
          patientId: session.patientId,
          sessionId: session.id,
          title: SESSION_NOTE_TITLE,
          body: remarks,
          updatedAt: null,
        }),
      );

      return {
        session: SessionDto.from(await this.reload(m, id), tz),
        note: NoteDto.from(note, tz),
      };
    });
  }

  async reschedule(therapistId: string, id: string, start: string): Promise<SessionDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    const startAt = new Date(start);
    return this.dataSource.transaction(async (m) => {
      const session = await this.lock(m, therapistId, id);
      transition(session.status, 'reschedule');
      if (startAt <= new Date()) throw slotInPast();

      if (startAt.getTime() !== session.startAt.getTime()) {
        await this.assertBookable(m, therapistId, startAt, id, () =>
          ApiException.validation({ start: 'No open slot at this time' }),
        );
        // The old slot frees itself: booked state is derived from sessions.
        await m.update(Session, { id }, { startAt });
      }
      return SessionDto.from(await this.reload(m, id), tz);
    });
  }

  private sortDirection(query: ListSessionsQueryDto): 'ASC' | 'DESC' {
    if (query.sort) return query.sort === 'start_asc' ? 'ASC' : 'DESC';
    const statuses = query.status ?? [];
    const onlyFuture =
      statuses.length > 0 &&
      statuses.every((s) => s === 'request' || s === 'upcoming');
    return onlyFuture ? 'ASC' : 'DESC';
  }

  /** Row-locks the session so concurrent actions on it run one at a time. */
  private async lock(m: EntityManager, therapistId: string, id: string): Promise<Session> {
    const session = await m.findOne(Session, {
      where: { id, therapistId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!session) throw ApiException.notFound('Session not found.');
    return session;
  }

  private reload(m: EntityManager, id: string): Promise<Session> {
    return m.findOneOrFail(Session, { where: { id }, relations: { patient: true } });
  }

  /**
   * The time needs an open (unblocked) slot and no other booked session.
   * `noSlot` builds the error for a missing or blocked slot.
   */
  private async assertBookable(
    m: EntityManager,
    therapistId: string,
    startAt: Date,
    sessionId: string,
    noSlot: () => ApiException,
  ): Promise<void> {
    const slot = await m.findOneBy(Slot, { therapistId, startAt });
    if (!slot || slot.isBlocked) throw noSlot();

    const clash = await m.exists(Session, {
      where: {
        therapistId,
        startAt,
        status: In(BOOKED_STATUSES),
        id: Not(sessionId),
      },
    });
    if (clash) throw slotBooked();
  }
}
