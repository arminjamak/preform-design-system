import { useMemo, useRef, useState, type ButtonHTMLAttributes } from 'react';
import { CalendarRangeIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import { Calendar } from '../Calendar/Calendar';
import { addDays, endOfMonth, formatShortDate, isSameDay, startOfDay, startOfMonth, type DateRange, type Weekday } from '../Calendar/dateUtils';
import { Popover } from '../Popover/Popover';
import s from './DateRangePicker.module.css';

export type { DateRange } from '../Calendar/dateUtils';

export type DateRangePreset = {
  label: string;
  /** Builds the range relative to today. */
  getRange: (today: Date) => { start: Date; end: Date };
};

/** Today, Last 7 days, Last 30 days, This month. */
export const DEFAULT_DATE_RANGE_PRESETS: DateRangePreset[] = [
  { label: 'Today', getRange: (t) => ({ start: t, end: t }) },
  { label: 'Last 7 days', getRange: (t) => ({ start: addDays(t, -6), end: t }) },
  { label: 'Last 30 days', getRange: (t) => ({ start: addDays(t, -29), end: t }) },
  { label: 'This month', getRange: (t) => ({ start: startOfMonth(t), end: endOfMonth(t) }) },
];

export type DateRangePickerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange' | 'children'> &
  WithForcedState & {
    /** Accessible name of the field. */
    label: string;
    value: DateRange;
    onChange: (value: DateRange) => void;
    /** Quick ranges shown beside the calendar. Pass [] to hide the column. */
    presets?: DateRangePreset[];
    placeholder?: string;
    min?: Date | null;
    max?: Date | null;
    isDateDisabled?: (date: Date) => boolean;
    weekStartsOn?: Weekday;
    size?: Size;
    invalid?: boolean;
    fullWidth?: boolean;
    /** Render with the popover already open (docs, screenshots). */
    defaultOpen?: boolean;
    /** Override "today" for presets and the today ring. */
    today?: Date;
    locale?: string;
  };

/** Range field: "start → end" trigger opening a range Calendar with quick presets. Print history and usage reports. */
export function DateRangePicker({
  label,
  value,
  onChange,
  presets = DEFAULT_DATE_RANGE_PRESETS,
  placeholder = 'Select dates',
  min,
  max,
  isDateDisabled,
  weekStartsOn,
  size = 'sm',
  disabled,
  invalid,
  fullWidth,
  defaultOpen = false,
  today: todayProp,
  locale = 'en-US',
  className,
  'data-state': state,
  ...rest
}: DateRangePickerProps) {
  const [open, setOpen] = useState(defaultOpen && !disabled);
  const [focusCalendar, setFocusCalendar] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const today = useMemo(() => startOfDay(todayProp ?? new Date()), [todayProp]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const fmt = (d: Date) => formatShortDate(d, locale);
  const text = value.start ? `${fmt(value.start)} → ${value.end ? fmt(value.end) : '…'}` : null;

  const isActive = (p: DateRangePreset) => {
    const r = p.getRange(today);
    return isSameDay(r.start, value.start) && isSameDay(r.end, value.end);
  };

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      className={cx(s.anchor, fullWidth && s.fullWidth)}
      trigger={
        <button
          ref={triggerRef}
          type="button"
          aria-label={text ? `${label}: ${text}` : label}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          data-state={state}
          className={cx(s.trigger, s[size], invalid && s.invalid, fullWidth && s.fullWidth, className)}
          onClick={() => {
            setFocusCalendar(true);
            setOpen((o) => !o);
          }}
          {...rest}
        >
          <span className={cx(s.text, !text && s.placeholder)}>{text ?? placeholder}</span>
          <CalendarRangeIcon className={s.icon} strokeWidth={2.2} aria-hidden="true" />
        </button>
      }
    >
      <div
        role="dialog"
        aria-label={`${label}: choose range`}
        className={s.panel}
        onKeyDown={(e) => {
          if (e.key === 'Escape') triggerRef.current?.focus();
        }}
      >
        {presets.length > 0 && (
          <div role="group" aria-label="Presets" className={s.presets}>
            {presets.map((p) => {
              const active = isActive(p);
              return (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={active}
                  className={cx(s.preset, active && s.presetActive)}
                  onClick={() => {
                    onChange(p.getRange(today));
                    close(true);
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}
        <Calendar
          mode="range"
          value={value}
          onChange={(r) => {
            onChange(r);
            if (r.start && r.end) close(true);
          }}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          weekStartsOn={weekStartsOn}
          today={today}
          locale={locale}
          autoFocus={focusCalendar}
        />
      </div>
    </Popover>
  );
}
