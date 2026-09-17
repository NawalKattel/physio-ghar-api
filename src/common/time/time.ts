import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO 8601 with the zone's offset, e.g. 2026-09-16T10:00:00+05:45. */
export function formatInZone(date: Date, tz: string): string {
  return formatInTimeZone(date, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export function formatNullableInZone(date: Date | null, tz: string): string | null {
  return date ? formatInZone(date, tz) : null;
}

/** YYYY-MM-DD of `date` as seen in the zone. */
export function localDate(date: Date, tz: string): string {
  return formatInTimeZone(date, tz, 'yyyy-MM-dd');
}

/** UTC instant of local midnight at the start of `day` (YYYY-MM-DD). */
export function startOfLocalDay(day: string, tz: string): Date {
  return fromZonedTime(`${day}T00:00:00`, tz);
}

/** Calendar arithmetic on YYYY-MM-DD strings (zone-independent). */
export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() -
      new Date(`${from}T00:00:00Z`).getTime()) /
      DAY_MS,
  );
}

/** [start, end) in UTC covering the local days from..to inclusive. */
export function localDayRange(from: string, to: string, tz: string): [Date, Date] {
  return [startOfLocalDay(from, tz), startOfLocalDay(addDays(to, 1), tz)];
}
