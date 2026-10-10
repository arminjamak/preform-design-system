import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { CheckIcon, ChevronDownIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Button } from '../Button/Button';
import { Popover } from '../Popover/Popover';
import { TextField } from '../TextField/TextField';
import type { ColumnFilterConfig } from './types';
import s from './DataTable.module.css';

export type TableFilterProps = WithForcedState & {
  /** Column name shown on the chip, e.g. "Status". */
  label: string;
  /** `'text'` for a contains match, or a list of options for an exact match. */
  config: 'text' | ColumnFilterConfig;
  /** Current filter value. Empty string means no filter. */
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/** Filter chip for one column. Opens a popover with a text box or a single-choice option list. */
export function TableFilter({ label, config, value, onChange, className, 'data-state': state }: TableFilterProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);
  const cfg: ColumnFilterConfig = config === 'text' ? { type: 'text' } : config;
  const options = cfg.type === 'select' ? cfg.options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)) : [];
  const active = value !== '';
  const display = cfg.type === 'select' ? options.find((o) => o.value === value)?.label ?? value : `“${value}”`;
  const headingId = useId();
  const groupRef = useRef<HTMLDivElement>(null);

  // Move focus into the option list when it opens (the text variant uses autoFocus).
  useEffect(() => {
    if (open) groupRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
  }, [open]);

  const onRadioKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const radios = Array.from(groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)') ?? []);
    const i = radios.indexOf(document.activeElement as HTMLButtonElement);
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    const next = radios[(i + step + radios.length) % radios.length];
    next?.focus();
    next?.click();
  };

  const choices = [{ value: '', label: 'Any' }, ...options];

  return (
    <span className={cx(s.chip, active && s.chipActive, className)}>
      <Popover
        open={open}
        onClose={close}
        align="start"
        padded={false}
        trigger={
          <button
            ref={triggerRef}
            type="button"
            aria-label={active ? `${label} filter: ${display}` : `Add ${label} filter`}
            className={s.chipButton}
            aria-haspopup="dialog"
            aria-expanded={open}
            data-state={state}
            onClick={() => setOpen((o) => !o)}
          >
            {!active && <PlusIcon className={s.chipIcon} strokeWidth={2.4} aria-hidden="true" />}
            <span className={s.chipLabel}>
              {label}
              {active && ':'}
            </span>
            {active && <span className={s.chipValue}>{display}</span>}
            <ChevronDownIcon className={s.chipIcon} strokeWidth={2.4} aria-hidden="true" />
          </button>
        }
      >
        <div role="dialog" aria-labelledby={headingId} className={s.filterPanel}>
          <p id={headingId} className={s.filterHeading}>
            Filter by {label}
          </p>
          {cfg.type === 'text' ? (
            <TextField
              label={`${label} contains`}
              placeholder={cfg.placeholder ?? 'Contains…'}
              value={value}
              onChange={onChange}
              iconStart={<SearchIcon strokeWidth={2.4} />}
              fullWidth
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && close()}
            />
          ) : (
            <div ref={groupRef} role="radiogroup" aria-labelledby={headingId} className={s.filterOptions} onKeyDown={onRadioKey}>
              {choices.map((o) => {
                const checked = o.value === value;
                return (
                  <button
                    key={o.value || '__any'}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    tabIndex={checked ? 0 : -1}
                    disabled={'disabled' in o ? o.disabled : undefined}
                    className={cx(s.filterOption, checked && s.filterOptionChecked)}
                    onClick={() => onChange(o.value)}
                  >
                    <span className={s.filterCheck}>{checked && <CheckIcon strokeWidth={3} aria-hidden="true" />}</span>
                    {o.label}
                  </button>
                );
              })}
            </div>
          )}
          {active && (
            <div className={s.filterFooter}>
              <Button variant="link" size="sm" onClick={() => onChange('')}>
                Clear filter
              </Button>
            </div>
          )}
        </div>
      </Popover>
      {active && (
        <button type="button" className={s.chipClear} aria-label={`Clear ${label} filter`} title={`Clear ${label} filter`} onClick={() => onChange('')}>
          <XIcon strokeWidth={2.6} aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
