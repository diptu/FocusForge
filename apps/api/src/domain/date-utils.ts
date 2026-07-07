/** Pure date helpers — UTC calendar-day arithmetic only, no timezone/locale lookups.
 * Matches the `@db.Date` storage for occurredAt/weekStartDate (see schema.prisma). */

export function toDateOnlyUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function isAfterDateOnly(a: Date, b: Date): boolean {
  return toDateOnlyUTC(a).getTime() > toDateOnlyUTC(b).getTime();
}

export function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Monday of the ISO week containing `date` (UTC, date-only). */
export function weekStartMonday(date: Date): Date {
  const d = toDateOnlyUTC(date);
  const daysSinceMonday = (d.getUTCDay() + 6) % 7; // Sun=0 -> 6, Mon=1 -> 0, ...
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}

/** First day of the UTC calendar month containing `date`. */
export function monthStartUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** Last day of the UTC calendar month containing `date`. */
export function monthEndUTC(date: Date): Date {
  const start = monthStartUTC(date);
  const nextMonthStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return addDaysUTC(nextMonthStart, -1);
}
