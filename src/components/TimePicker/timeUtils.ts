/** Time helpers for TimePicker. Values are 24-hour `HH:mm` or `HH:mm:ss` strings. */

export type TimeParts = { h: number | null; m: number | null; s: number | null };

const pad = (n: number) => String(n).padStart(2, '0');

export function parseTime(value: string): { h: number; m: number; s: number } | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const [h, m, s] = [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
  return h < 24 && m < 60 && s < 60 ? { h, m, s } : null;
}

export function formatTime(h: number, m: number, s: number | null): string {
  return s === null ? `${pad(h)}:${pad(m)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export const to12 = (h: number) => h % 12 || 12;

/** Human label for a list option: `14:30` or `2:30 PM`. */
export function formatTimeLabel(h: number, m: number, hourCycle: '12' | '24'): string {
  return hourCycle === '24' ? `${pad(h)}:${pad(m)}` : `${to12(h)}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Steps to the next/previous multiple of `step`, wrapping within [0, size). */
export function stepValue(current: number | null, dir: 1 | -1, step: number, size: number): number {
  if (current === null) return dir === 1 ? 0 : size - step;
  const next = dir === 1 ? (Math.floor(current / step) + 1) * step : (Math.ceil(current / step) - 1) * step;
  return ((next % size) + size) % size;
}

export { pad as padTime };
