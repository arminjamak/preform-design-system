/**
 * Small, dependency-free date helpers shared by Calendar, DatePicker and DateRangePicker.
 * All dates are treated as local calendar days (time of day is ignored).
 */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DateRange = { start: Date | null; end: Date | null };

const pad = (n: number) => String(n).padStart(2, '0');

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), daysInMonth(d));
}

/** Moves by whole months, clamping the day so Jan 31 + 1 month = Feb 28/29. */
export function addMonths(d: Date, n: number): Date {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), daysInMonth(first)));
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Negative when a is before b, 0 on the same day, positive after. */
export function compareDay(a: Date, b: Date): number {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

export function startOfWeek(d: Date, weekStartsOn: Weekday): Date {
  return addDays(d, -((d.getDay() - weekStartsOn + 7) % 7));
}

export function endOfWeek(d: Date, weekStartsOn: Weekday): Date {
  return addDays(startOfWeek(d, weekStartsOn), 6);
}

export function isOutOfRange(d: Date, min?: Date | null, max?: Date | null): boolean {
  return (!!min && compareDay(d, min) < 0) || (!!max && compareDay(d, max) > 0);
}

export function clampDay(d: Date, min?: Date | null, max?: Date | null): Date {
  if (min && compareDay(d, min) < 0) return startOfDay(min);
  if (max && compareDay(d, max) > 0) return startOfDay(max);
  return d;
}

/** `yyyy-mm-dd`, the format PreForm uses in fields and logs. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses a strict `yyyy-mm-dd` string; returns null for anything else or an impossible date. */
export function parseISODate(text: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!m) return null;
  const [y, mo, da] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const d = new Date(y, mo, da);
  return d.getFullYear() === y && d.getMonth() === mo && d.getDate() === da ? d : null;
}

export function formatMonthYear(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d);
}

export function formatFullDate(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(d);
}

export function formatShortDate(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
}

/** Weekday column headers starting at `weekStartsOn`. 2023-01-01 is a Sunday. */
export function weekdayNames(weekStartsOn: Weekday, locale: string): Array<{ short: string; long: string }> {
  const short = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const long = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2023, 0, 1 + ((weekStartsOn + i) % 7));
    return { short: short.format(d).slice(0, 2), long: long.format(d) };
  });
}

/** Orders a range so start <= end. */
export function orderRange(a: Date, b: Date): { start: Date; end: Date } {
  return compareDay(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
}
