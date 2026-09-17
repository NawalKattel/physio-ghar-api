import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  In,
  LessThan,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { localDate, localDayRange } from '../common/time/time';
import { SessionDto } from '../sessions/dto/session.dto';
import { BOOKED_STATUSES, Session } from '../sessions/session.entity';
import { TherapistsService } from '../therapists/therapists.service';
import { DashboardDto } from './dashboard.dto';

const UPCOMING_LIMIT = 3;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    private readonly therapists: TherapistsService,
  ) {}

  async get(therapistId: string, requestedDate?: string): Promise<DashboardDto> {
    const therapist = await this.therapists.getSelf(therapistId);
    const tz = therapist.timeZone;
    const date = requestedDate ?? localDate(new Date(), tz);
    const [dayStart, dayEnd] = localDayRange(date, date, tz);

    const [today, upcoming, pendingRequests] = await Promise.all([
      this.sessions.find({
        where: {
          therapistId,
          status: In(BOOKED_STATUSES),
          startAt: And(MoreThanOrEqual(dayStart), LessThan(dayEnd)),
        },
        relations: { patient: true },
        order: { startAt: 'ASC', id: 'ASC' },
      }),
      this.sessions.find({
        where: { therapistId, status: 'upcoming', startAt: MoreThanOrEqual(dayEnd) },
        relations: { patient: true },
        order: { startAt: 'ASC', id: 'ASC' },
        take: UPCOMING_LIMIT,
      }),
      this.sessions.countBy({
        therapistId,
        status: 'request',
        startAt: MoreThan(new Date()),
      }),
    ]);

    return {
      date,
      summary: {
        todaySessions: today.length,
        pendingRequests,
        completedSessions: today.filter((s) => s.status === 'completed').length,
      },
      today: today.map((s) => SessionDto.from(s, tz)),
      upcoming: upcoming.map((s) => SessionDto.from(s, tz)),
      isAvailable: therapist.isAvailable,
    };
  }
}
