import { useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { IconButton } from '../IconButton/IconButton';
import {
  addDays,
  addMonths,
  clampDay,
  compareDay,
  endOfMonth,
  endOfWeek,
  formatFullDate,
  formatMonthYear,
  isOutOfRange,
  isSameDay,
  isSameMonth,
  orderRange,
  startOfDay,
  startOfMonth,
  startOfWeek,
  weekdayNames,
  type DateRange,
  type Weekday,
} from './dateUtils';
import s from './Calendar.module.css';

export type { DateRange, Weekday } from './dateUtils';

type CalendarCommonProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'autoFocus'> &
  WithForcedState & {
    /** Earliest selectable day. */
    min?: Date | null;
    /** Latest selectable day. */
    max?: Date | null;
    /** Return true to block a day (e.g. printer in maintenance). */
    isDateDisabled?: (date: Date) => boolean;
    /** 0 = Sunday … 6 = Saturday. */
    weekStartsOn?: Weekday;
    /** Month shown first when there is no value. */
    defaultMonth?: Date;
    /** Override "today" (stable screenshots, server time). */
    today?: Date;
    /** BCP 47 locale for month and weekday names. */
    locale?: string;
    disabled?: boolean;
    /** Move focus into the grid on mount (used when opened from a picker). */
    autoFocus?: boolean;
    /** Accessible name for the calendar group. */
    label?: string;
  };

export type CalendarSingleProps = CalendarCommonProps & {
  mode?: 'single';
  value: Date | null;
  onChange: (value: Date) => void;
};

export type CalendarRangeProps = CalendarCommonProps & {
  mode: 'range';
  value: DateRange;
  onChange: (value: DateRange) => void;
};

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

/** Next range after clicking `day`: first click sets start, second sets end (swapping if earlier). */
function nextRange(current: DateRange, day: Date): DateRange {
  if (!current.start || current.end) return { start: day, end: null };
  return orderRange(current.start, day);
}

/** Month grid for picking a day or a range. Print scheduling, resin tank replacement dates, maintenance windows. */
export function Calendar(props: CalendarProps) {
  const {
    mode = 'single',
    value,
    onChange,
    min,
    max,
    isDateDisabled,
    weekStartsOn = 0,
    defaultMonth,
    today: todayProp,
    locale = 'en-US',
    disabled,
    autoFocus,
    label,
    className,
    'data-state': state,
    ...rest
  } = props;

  const isRange = mode === 'range';
  const range = isRange ? (value as DateRange) : null;
  const single = isRange ? null : (value as Date | null);
  const anchor = isRange ? range?.start ?? null : single;
  const today = useMemo(() => startOfDay(todayProp ?? new Date()), [todayProp]);

  const [view, setView] = useState(() => startOfMonth(anchor ?? defaultMonth ?? today));
  const [focused, setFocused] = useState(() => startOfDay(anchor ?? defaultMonth ?? today));
  const [hovered, setHovered] = useState<Date | null>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const focusPending = useRef(false);
  const titleId = useId();

  // Follow the value when it changes from outside (typed into a field, preset applied).
  const anchorTime = anchor?.getTime();
  useEffect(() => {
    if (anchorTime === undefined) return;
    const a = new Date(anchorTime);
    setFocused(startOfDay(a));
    setView((v) => (isSameMonth(a, v) ? v : startOfMonth(a)));
  }, [anchorTime]);

  useEffect(() => {
    if (focusPending.current) {
      focusPending.current = false;
      gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
    }
  });

  useEffect(() => {
    if (autoFocus) gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
    // Only on mount: pickers remount the calendar each time they open.
  }, []);

  const isBlocked = (d: Date) => !!disabled || isOutOfRange(d, min, max) || !!isDateDisabled?.(d);
  const tabbable = isSameMonth(focused, view) ? focused : startOfMonth(view);

  const days = useMemo(() => {
    const first = startOfWeek(startOfMonth(view), weekStartsOn);
    return Array.from({ length: 42 }, (_, i) => addDays(first, i));
  }, [view, weekStartsOn]);
  const weekdays = useMemo(() => weekdayNames(weekStartsOn, locale), [weekStartsOn, locale]);

  // Range shading: committed range, or a preview from the start to the hovered/focused day.
  let span: { start: Date; end: Date; preview: boolean } | null = null;
  if (range?.start && range.end) span = { ...orderRange(range.start, range.end), preview: false };
  else if (range?.start && hovered && !isBlocked(hovered)) span = { ...orderRange(range.start, hovered), preview: true };

  const prevDisabled = !!disabled || (!!min && compareDay(endOfMonth(addMonths(view, -1)), min) < 0);
  const nextDisabled = !!disabled || (!!max && compareDay(startOfMonth(addMonths(view, 1)), max) > 0);

  const goMonth = (delta: number) => {
    setView((v) => addMonths(v, delta));
    setFocused((f) => clampDay(addMonths(f, delta), min, max));
  };

  const moveFocus = (next: Date) => {
    const d = clampDay(next, min, max);
    setFocused(d);
    if (!isSameMonth(d, view)) setView(startOfMonth(d));
    focusPending.current = true;
    if (range?.start && !range.end) setHovered(d);
  };

  const select = (d: Date) => {
    if (isBlocked(d)) return;
    setFocused(d);
    if (!isSameMonth(d, view)) {
      setView(startOfMonth(d));
      focusPending.current = true; // the clicked button re-renders in the new month's grid
    }
    if (isRange) (onChange as (v: DateRange) => void)(nextRange(range ?? { start: null, end: null }, d));
    else (onChange as (v: Date) => void)(d);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    const f = focused;
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(f, -1),
      ArrowRight: () => addDays(f, 1),
      ArrowUp: () => addDays(f, -7),
      ArrowDown: () => addDays(f, 7),
      PageUp: () => addMonths(f, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(f, e.shiftKey ? 12 : 1),
      Home: () => startOfWeek(f, weekStartsOn),
      End: () => endOfWeek(f, weekStartsOn),
    };
    const fn = map[e.key];
    if (!fn) return;
    e.preventDefault();
    moveFocus(fn());
  };

  const monthTitle = formatMonthYear(view, locale);

  return (
    <div
      role="group"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cx(s.calendar, disabled && s.disabled, className)}
      data-state={state}
      {...rest}
    >
      <div className={s.header}>
        <IconButton label="Previous month" icon={<ChevronLeftIcon strokeWidth={2.2} />} size="sm" disabled={prevDisabled} onClick={() => goMonth(-1)} />
        <span id={titleId} className={s.title} aria-live="polite">
          {monthTitle}
        </span>
        <IconButton label="Next month" icon={<ChevronRightIcon strokeWidth={2.2} />} size="sm" disabled={nextDisabled} onClick={() => goMonth(1)} />
      </div>
      <table
        ref={gridRef}
        role="grid"
        aria-labelledby={titleId}
        aria-multiselectable={isRange || undefined}
        className={s.grid}
        onKeyDown={onKeyDown}
        onMouseLeave={() => setHovered(null)}
      >
        <thead>
          <tr>
            {weekdays.map((w) => (
              <th key={w.long} scope="col" abbr={w.long} className={s.weekday}>
                {w.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, row) => (
            <tr key={row}>
              {days.slice(row * 7, row * 7 + 7).map((d) => {
                const blocked = isBlocked(d);
                const outside = !isSameMonth(d, view);
                const isStart = !!span && isSameDay(d, span.start);
                const isEnd = !!span && isSameDay(d, span.end);
                const between = !!span && compareDay(d, span.start) > 0 && compareDay(d, span.end) < 0;
                const selected = isRange ? (isSameDay(d, range?.start) || isSameDay(d, range?.end)) : isSameDay(d, single);
                const ariaSelected = isRange ? (!!span && !span.preview && (isStart || isEnd || between)) || selected : selected;
                const isTabbable = isSameDay(d, tabbable);
                return (
                  <td
                    key={d.getTime()}
                    role="gridcell"
                    aria-selected={ariaSelected}
                    className={cx(
                      s.cell,
                      span && span.preview && s.preview,
                      between && s.rangeMid,
                      isStart && !isEnd && s.rangeStart,
                      isEnd && !isStart && s.rangeEnd,
                    )}
                  >
                    <button
                      type="button"
                      tabIndex={isTabbable && !disabled ? 0 : -1}
                      aria-label={formatFullDate(d, locale)}
                      aria-current={isSameDay(d, today) ? 'date' : undefined}
                      aria-disabled={blocked || undefined}
                      disabled={disabled}
                      className={cx(
                        s.day,
                        outside && s.outside,
                        blocked && s.blocked,
                        isSameDay(d, today) && s.today,
                        (selected || (span?.preview && (isStart || isEnd))) && s.selected,
                      )}
                      onClick={() => select(d)}
                      onFocus={() => {
                        if (!isSameDay(d, focused)) setFocused(d);
                      }}
                      onMouseEnter={() => range?.start && !range.end && setHovered(d)}
                    >
                      {d.getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
