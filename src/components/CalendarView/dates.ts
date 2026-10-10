/** Small local-time date helpers for CalendarView (no dependency on other date pickers). */

export type DateInput = Date | string | number;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses Date | ISO string | timestamp. `YYYY-MM-DD` is read as local midnight (not UTC). */
export function toDate(v: DateInput): Date {
  if (v instanceof Date) return new Date(v.getTime());
  if (typeof v === 'string') {
    const m = DATE_ONLY.exec(v);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(v);
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
export const addMonths = (d: Date, n: number) => {
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  r.setDate(Math.min(d.getDate(), new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()));
  return r;
};
export const addMinutes = (d: Date, n: number) => new Date(d.getTime() + n * 60000);
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const startOfWeek = (d: Date, weekStartsOn: number) => {
  const s = startOfDay(d);
  return addDays(s, -((s.getDay() - weekStartsOn + 7) % 7));
};
export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
/** Whole calendar days between two dates (DST-safe). */
export const dayDiff = (a: Date, b: Date) => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
export const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fmt = (locale: string, opts: Intl.DateTimeFormatOptions) => {
  const f = new Intl.DateTimeFormat(locale, opts);
  return (d: Date) => f.format(d);
};
