import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../common/errors/api-exception';
import { slotBooked, slotInPast } from '../common/errors/errors';
import {
  addDays,
  daysBetween,
  formatInZone,
  localDate,
  localDayRange,
} from '../common/time/time';
import { BOOKED_STATUSES } from '../sessions/session.entity';
import { TherapistsService } from '../therapists/therapists.service';
import { SlotDayDto, SlotDaysDto, SlotDto } from './dto/slot.dto';
import { CreateSlotDto, ListSlotsQueryDto } from './dto/slot-requests.dto';
import { Slot } from './slot.entity';

const MAX_RANGE_DAYS = 31;

interface SlotRow {
  id: string;
  start_at: Date;
  duration_minutes: number;
  is_blocked: boolean;
  session_id: string | null;
  patient_name: string | null;
  treatment: string | null;
}

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot) private readonly slots: Repository<Slot>,
    private readonly therapists: TherapistsService,
  ) {}

  async listDays(therapistId: string, query: ListSlotsQueryDto): Promise<SlotDaysDto> {
    const span = daysBetween(query.from, query.to);
    if (span < 0) throw ApiException.validation({ to: 'to must be on or after from' });
    if (span + 1 > MAX_RANGE_DAYS) {
      throw ApiException.validation({ to: `The range can be at most ${MAX_RANGE_DAYS} days` });
    }

    const tz = await this.therapists.getTimeZone(therapistId);
    const [start, end] = localDayRange(query.from, query.to, tz);
    const rows = await this.queryRows(
      therapistId,
      `sl.start_at >= $3 AND sl.start_at < $4`,
      [start, end],
    );

    const byDate = new Map<string, SlotDto[]>();
    for (const row of rows) {
      const date = localDate(row.start_at, tz);
      byDate.set(date, [...(byDate.get(date) ?? []), this.toDto(row, tz)]);
    }

    const days: SlotDayDto[] = [];
    for (let date = query.from; date <= query.to; date = addDays(date, 1)) {
      const slots = byDate.get(date) ?? [];
      days.push({
        date,
        counts: {
          open: slots.filter((s) => s.state === 'open').length,
          booked: slots.filter((s) => s.state === 'booked').length,
          blocked: slots.filter((s) => s.state === 'blocked').length,
        },
        slots,
      });
    }
    return { days };
  }

  async create(therapistId: string, dto: CreateSlotDto): Promise<SlotDto> {
    const startAt = new Date(dto.start);
    if (startAt <= new Date()) throw slotInPast();
    // A duplicate start violates uq_slots_therapist_start → SLOT_TAKEN (see ApiExceptionFilter).
    const slot = await this.slots.save(
      this.slots.create({
        therapistId,
        startAt,
        durationMinutes: dto.durationMinutes ?? 60,
        isBlocked: false,
      }),
    );
    return this.getDto(therapistId, slot.id);
  }

  async block(therapistId: string, id: string): Promise<SlotDto> {
    const row = await this.getRow(therapistId, id);
    if (row.session_id) throw slotBooked('A booked slot can’t be blocked.');
    await this.slots.update({ id, therapistId }, { isBlocked: true });
    return this.getDto(therapistId, id);
  }

  async unblock(therapistId: string, id: string): Promise<SlotDto> {
    await this.getRow(therapistId, id);
    await this.slots.update({ id, therapistId }, { isBlocked: false });
    return this.getDto(therapistId, id);
  }

  async remove(therapistId: string, id: string): Promise<void> {
    const row = await this.getRow(therapistId, id);
    if (row.session_id) throw slotBooked('A booked slot can’t be removed.');
    await this.slots.delete({ id, therapistId });
  }

  private async getDto(therapistId: string, id: string): Promise<SlotDto> {
    const tz = await this.therapists.getTimeZone(therapistId);
    return this.toDto(await this.getRow(therapistId, id), tz);
  }

  private async getRow(therapistId: string, id: string): Promise<SlotRow> {
    const [row] = await this.queryRows(therapistId, `sl.id = $3`, [id]);
    if (!row) throw ApiException.notFound('Slot not found.');
    return row;
  }

  /** Slots joined with the session that books them, if any — booked state is derived here. */
  private queryRows(
    therapistId: string,
    condition: string,
    params: unknown[],
  ): Promise<SlotRow[]> {
    return this.slots.query(
      `SELECT sl.id, sl.start_at, sl.duration_minutes, sl.is_blocked,
              s.id AS session_id, p.name AS patient_name, s.treatment
         FROM slots sl
         LEFT JOIN sessions s
           ON s.therapist_id = sl.therapist_id
          AND s.start_at = sl.start_at
          AND s.status = ANY($2)
         LEFT JOIN patients p ON p.id = s.patient_id
        WHERE sl.therapist_id = $1 AND ${condition}
        ORDER BY sl.start_at`,
      [therapistId, BOOKED_STATUSES, ...params],
    );
  }

  private toDto(row: SlotRow, tz: string): SlotDto {
    const booked = row.session_id !== null;
    return {
      id: row.id,
      start: formatInZone(new Date(row.start_at), tz),
      durationMinutes: row.duration_minutes,
      state: booked ? 'booked' : row.is_blocked ? 'blocked' : 'open',
      session: booked
        ? {
            id: row.session_id!,
            patientName: row.patient_name!,
            treatment: row.treatment!,
          }
        : null,
    };
  }
}
