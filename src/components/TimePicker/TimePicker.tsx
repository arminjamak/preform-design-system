import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ClockIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import { IconButton } from '../IconButton/IconButton';
import { Popover } from '../Popover/Popover';
import { formatTime, formatTimeLabel, padTime, parseTime, stepValue, to12, type TimeParts } from './timeUtils';
import s from './TimePicker.module.css';

export type TimePickerProps = WithForcedState & {
  /** Accessible name of the field. */
  label: string;
  /** 24-hour `HH:mm` (or `HH:mm:ss` with seconds); empty string when unset. */
  value: string;
  onChange: (value: string) => void;
  /** Display cycle. The value is always 24-hour. */
  hourCycle?: '12' | '24';
  /** Minute increment for arrow keys. */
  step?: number;
  withSeconds?: boolean;
  /** Adds a clock button opening a scrollable list of times. */
  withList?: boolean;
  /** Minutes between list options. Defaults to `step` (or 15 when step is 1). */
  listStep?: number;
  size?: Size;
  disabled?: boolean;
  invalid?: boolean;
  /** Render with the list already open (docs, screenshots). */
  defaultOpen?: boolean;
  id?: string;
  name?: string;
  className?: string;
};

type SegmentKey = 'h' | 'm' | 's' | 'p';
const SEGMENT_LABEL: Record<SegmentKey, string> = { h: 'Hours', m: 'Minutes', s: 'Seconds', p: 'AM/PM' };
const EMPTY: TimeParts = { h: null, m: null, s: null };

/** Segmented time field with arrow-key stepping and an optional list of times. Print start times, maintenance slots. */
export function TimePicker({
  label,
  value,
  onChange,
  hourCycle = '24',
  step = 1,
  withSeconds = false,
  withList = false,
  listStep,
  size = 'sm',
  disabled,
  invalid,
  defaultOpen = false,
  id,
  name,
  className,
  'data-state': state,
}: TimePickerProps) {
  const is12 = hourCycle === '12';
  const fromValue = (v: string): TimeParts => {
    const t = parseTime(v);
    return t ? { h: t.h, m: t.m, s: withSeconds ? t.s : null } : EMPTY;
  };

  const [parts, setParts] = useState<TimeParts>(() => fromValue(value));
  const [pm, setPm] = useState(() => (parseTime(value)?.h ?? 0) >= 12);
  const [open, setOpen] = useState(defaultOpen && withList && !disabled);
  const [focusList, setFocusList] = useState(false);
  const lastEmitted = useRef<string | null>(null);
  const buffer = useRef('');
  const segRefs = useRef<Partial<Record<SegmentKey, HTMLSpanElement | null>>>({});
  const listId = useId();

  // Sync from outside unless this is the echo of our own (possibly partial) edit.
  useEffect(() => {
    if (value === lastEmitted.current) return;
    const next = fromValue(value);
    setParts(next);
    if (next.h !== null) setPm(next.h >= 12);
    // fromValue only depends on withSeconds.
  }, [value, withSeconds]);

  const segments: SegmentKey[] = ['h', 'm', ...(withSeconds ? (['s'] as const) : []), ...(is12 ? (['p'] as const) : [])];

  const commit = (next: TimeParts) => {
    setParts(next);
    const complete = next.h !== null && next.m !== null && (!withSeconds || next.s !== null);
    const out = complete ? formatTime(next.h as number, next.m as number, withSeconds ? (next.s as number) : null) : '';
    if (out !== value) {
      lastEmitted.current = out;
      onChange(out);
    }
  };

  const focusSegment = (key: SegmentKey | undefined) => key && segRefs.current[key]?.focus();
  const neighbour = (key: SegmentKey, dir: 1 | -1) => segments[segments.indexOf(key) + dir];

  const setHour12 = (h12: number, isPm = pm) => (h12 % 12) + (isPm ? 12 : 0);
  const setPeriod = (nextPm: boolean) => {
    setPm(nextPm);
    if (parts.h !== null && parts.h >= 12 !== nextPm) commit({ ...parts, h: (parts.h + 12) % 24 });
  };

  const stepSegment = (key: SegmentKey, dir: 1 | -1) => {
    if (key === 'p') return setPeriod(!pm);
    if (key === 'h') {
      if (is12) {
        const cur = parts.h === null ? null : parts.h % 12;
        return commit({ ...parts, h: setHour12(stepValue(cur, dir, 1, 12)) });
      }
      return commit({ ...parts, h: stepValue(parts.h, dir, 1, 24) });
    }
    return commit({ ...parts, [key]: stepValue(parts[key], dir, key === 'm' ? step : 1, 60) });
  };

  const typeDigit = (key: Exclude<SegmentKey, 'p'>, digit: string) => {
    const max = key === 'h' ? (is12 ? 12 : 23) : 59;
    let candidate = buffer.current + digit;
    if (Number(candidate) > max) candidate = digit;
    const num = Number(candidate);
    const done = candidate.length === 2 || num * 10 > max;
    buffer.current = done ? '' : candidate;
    if (key === 'h' && is12 && num === 0) return; // wait for the second digit of 01–09
    commit({ ...parts, [key]: key === 'h' && is12 ? setHour12(num) : num });
    if (done) focusSegment(neighbour(key, 1));
  };

  const onSegmentKeyDown = (key: SegmentKey) => (e: KeyboardEvent<HTMLSpanElement>) => {
    if (disabled) return;
    const k = e.key;
    let handled = true;
    if (k === 'ArrowUp') stepSegment(key, 1);
    else if (k === 'ArrowDown') stepSegment(key, -1);
    else if (k === 'ArrowLeft') focusSegment(neighbour(key, -1));
    else if (k === 'ArrowRight') focusSegment(neighbour(key, 1));
    else if (k === 'Home' || k === 'End') {
      if (key === 'p') setPeriod(k === 'End');
      else if (key === 'h') commit({ ...parts, h: is12 ? setHour12(k === 'Home' ? 1 : 12) : k === 'Home' ? 0 : 23 });
      else commit({ ...parts, [key]: k === 'Home' ? 0 : key === 'm' ? 60 - step : 59 });
    } else if (k === 'Backspace' || k === 'Delete') {
      buffer.current = '';
      if (key !== 'p') commit({ ...parts, [key]: null });
    } else if (key === 'p' && /^[ap]$/i.test(k)) setPeriod(k.toLowerCase() === 'p');
    else if (key !== 'p' && /^\d$/.test(k)) typeDigit(key, k);
    else if (withList && k === 'ArrowDown' && e.altKey) setOpen(true);
    else handled = false;
    if (handled) e.preventDefault();
  };

  const display = (key: SegmentKey): { text: string; now?: number; min: number; max: number; valueText: string } => {
    if (key === 'p') return { text: pm ? 'PM' : 'AM', now: pm ? 1 : 0, min: 0, max: 1, valueText: pm ? 'PM' : 'AM' };
    const v = parts[key];
    const shown = v === null ? null : key === 'h' && is12 ? to12(v) : v;
    const [min, max] = key === 'h' ? (is12 ? [1, 12] : [0, 23]) : [0, 59];
    return { text: shown === null ? '--' : padTime(shown), now: shown ?? undefined, min, max, valueText: shown === null ? 'Empty' : String(shown) };
  };

  // List of times for the popover.
  const interval = listStep ?? (step > 1 ? step : 15);
  const options = useMemo(() => {
    const out: Array<{ value: string; label: string }> = [];
    for (let t = 0; t < 24 * 60; t += interval) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      out.push({ value: formatTime(h, m, withSeconds ? 0 : null), label: formatTimeLabel(h, m, hourCycle) });
    }
    return out;
  }, [interval, withSeconds, hourCycle]);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const [active, setActive] = useState(Math.max(0, selectedIndex));
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, selectedIndex);
    setActive(idx);
    const list = listRef.current;
    const el = list?.children[idx] as HTMLElement | undefined;
    if (list && el) list.scrollTop = el.offsetTop - (list.clientHeight - el.offsetHeight) / 2;
    if (focusList) list?.focus();
    // Only when opening.
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    const el = list?.children[active] as HTMLElement | undefined;
    if (!list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  }, [active]);

  const pick = (v: string) => {
    lastEmitted.current = null;
    onChange(v);
    setOpen(false);
    focusSegment('h');
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const last = options.length - 1;
    const moves: Record<string, number> = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: last, PageDown: active + 8, PageUp: active - 8 };
    if (e.key in moves) {
      e.preventDefault();
      setActive(Math.min(last, Math.max(0, moves[e.key])));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(options[active].value);
    } else if (e.key === 'Escape') {
      focusSegment('h');
    }
  };

  const field = (
    <span
      role="group"
      aria-label={label}
      id={id}
      aria-invalid={invalid || undefined}
      aria-disabled={disabled || undefined}
      data-state={state}
      className={cx(s.wrap, s[size], invalid && s.invalid, disabled && s.disabled, className)}
    >
      {!withList && <ClockIcon className={s.icon} strokeWidth={2.2} aria-hidden="true" />}
      <span className={s.segments}>
        {segments.map((key, i) => {
          const d = display(key);
          return (
            <span key={key} className={s.segmentWrap}>
              {i > 0 && key !== 'p' && (
                <span className={s.sep} aria-hidden="true">
                  :
                </span>
              )}
              <span
                ref={(el) => {
                  segRefs.current[key] = el;
                }}
                role="spinbutton"
                tabIndex={disabled ? -1 : 0}
                aria-label={SEGMENT_LABEL[key]}
                aria-valuenow={d.now}
                aria-valuemin={d.min}
                aria-valuemax={d.max}
                aria-valuetext={d.valueText}
                aria-disabled={disabled || undefined}
                inputMode={key === 'p' ? undefined : 'numeric'}
                className={cx(s.segment, key === 'p' && s.period, d.now === undefined && s.empty)}
                onKeyDown={onSegmentKeyDown(key)}
                onBlur={() => {
                  buffer.current = '';
                }}
              >
                {d.text}
              </span>
            </span>
          );
        })}
      </span>
      {withList && (
        <IconButton
          label={open ? 'Close time list' : 'Open time list'}
          size={size === 'sm' ? 'xs' : 'sm'}
          icon={<ClockIcon strokeWidth={2.2} />}
          className={s.listButton}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onClick={() => {
            setFocusList(true);
            setOpen((o) => !o);
          }}
        />
      )}
      {name && <input type="hidden" name={name} value={value} />}
    </span>
  );

  if (!withList) return field;

  return (
    <Popover open={open} onClose={() => setOpen(false)} padded={false} className={s.anchor} trigger={field}>
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={`${label}: times`}
        tabIndex={0}
        aria-activedescendant={`${listId}-${active}`}
        className={s.list}
        onKeyDown={onListKeyDown}
      >
        {options.map((o, i) => (
          <li
            key={o.value}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === selectedIndex}
            className={cx(s.option, i === active && s.optionActive, i === selectedIndex && s.optionSelected)}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(i)}
            onClick={() => pick(o.value)}
          >
            {o.label}
          </li>
        ))}
      </ul>
    </Popover>
  );
}
