import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { CalendarIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import { Calendar } from '../Calendar/Calendar';
import { isOutOfRange, parseISODate, toISODate, type Weekday } from '../Calendar/dateUtils';
import { IconButton } from '../IconButton/IconButton';
import { Popover } from '../Popover/Popover';
import { TextField } from '../TextField/TextField';
import s from './DatePicker.module.css';

export type DatePickerProps = WithForcedState & {
  /** Accessible name of the field. */
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  placeholder?: string;
  min?: Date | null;
  max?: Date | null;
  isDateDisabled?: (date: Date) => boolean;
  weekStartsOn?: Weekday;
  size?: Size;
  disabled?: boolean;
  invalid?: boolean;
  fullWidth?: boolean;
  /** Show the clear button when a date is set. */
  clearable?: boolean;
  /** Render with the calendar already open (docs, screenshots). */
  defaultOpen?: boolean;
  /** Override "today" for the calendar's today ring. */
  today?: Date;
  locale?: string;
  id?: string;
  name?: string;
  className?: string;
};

const ICON_SIZE: Record<Size, 'xs' | 'sm'> = { sm: 'xs', md: 'sm', lg: 'sm' };

/** Date field: type `yyyy-mm-dd` or pick from a Calendar popover. Scheduling a print, logging a resin tank swap. */
export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'yyyy-mm-dd',
  min,
  max,
  isDateDisabled,
  weekStartsOn,
  size = 'sm',
  disabled,
  invalid,
  fullWidth,
  clearable = true,
  defaultOpen = false,
  today,
  locale,
  id,
  name,
  className,
  'data-state': state,
}: DatePickerProps) {
  const [open, setOpen] = useState(defaultOpen && !disabled);
  const [draft, setDraft] = useState(value ? toISODate(value) : '');
  const [focusCalendar, setFocusCalendar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const valueKey = value ? toISODate(value) : '';
  useEffect(() => setDraft(valueKey), [valueKey]);

  const allowed = (d: Date) => !isOutOfRange(d, min, max) && !isDateDisabled?.(d);
  const parsed = draft ? parseISODate(draft) : null;
  const draftInvalid = draft !== '' && (!parsed || !allowed(parsed));
  // Only flag once a full yyyy-mm-dd has been typed, so the border does not flash red mid-entry.
  const showInvalid = draftInvalid && draft.length >= 10;

  const openCalendar = (withFocus: boolean) => {
    if (disabled) return;
    setFocusCalendar(withFocus);
    setOpen(true);
  };
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) inputRef.current?.focus();
  };

  const onType = (text: string) => {
    setDraft(text);
    if (text === '') return onChange(null);
    const d = parseISODate(text);
    if (d && allowed(d)) onChange(d);
  };

  const onBlur = () => {
    // Leave a half-typed value visible as invalid only while it is being edited.
    if (draft !== '' && draftInvalid) setDraft(valueKey);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && (e.altKey || !open)) {
      e.preventDefault();
      openCalendar(true);
    } else if (e.key === 'Enter' && draftInvalid) {
      setDraft(valueKey);
    }
  };

  const iconSize = ICON_SIZE[size];

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      className={cx(s.anchor, fullWidth && s.fullWidth, className)}
      trigger={
        <TextField
          ref={inputRef}
          id={id}
          name={name}
          label={label}
          value={draft}
          onChange={onType}
          onBlur={onBlur}
          onKeyDown={onInputKeyDown}
          placeholder={placeholder}
          size={size}
          disabled={disabled}
          invalid={invalid || showInvalid}
          fullWidth={fullWidth}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          aria-haspopup="dialog"
          aria-expanded={open}
          data-state={state}
          className={s.field}
          iconEnd={
            <span className={s.actions}>
              {clearable && value && !disabled && (
                <IconButton
                  label="Clear date"
                  size={iconSize}
                  icon={<XIcon strokeWidth={2.2} />}
                  className={s.action}
                  onClick={() => {
                    onChange(null);
                    setDraft('');
                    inputRef.current?.focus();
                  }}
                />
              )}
              <IconButton
                label={open ? 'Close calendar' : 'Open calendar'}
                size={iconSize}
                icon={<CalendarIcon strokeWidth={2.2} />}
                className={s.action}
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => (open ? close(false) : openCalendar(true))}
              />
            </span>
          }
        />
      }
    >
      <div
        role="dialog"
        aria-label={`${label}: choose date`}
        onKeyDown={(e) => {
          if (e.key === 'Escape') inputRef.current?.focus();
        }}
      >
        <Calendar
          value={value}
          onChange={(d) => {
            onChange(d);
            close(true);
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
