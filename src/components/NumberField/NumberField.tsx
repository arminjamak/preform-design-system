import { useState } from 'react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import s from './NumberField.module.css';

export type NumberFieldProps = WithForcedState & {
  label: string;
  value: number;
  onChange: (value: number) => void;
  decimals?: number;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  size?: Size;
  disabled?: boolean;
  invalid?: boolean;
  fullWidth?: boolean;
  className?: string;
};

/** Numeric input with unit suffix and stacked steppers, as used for dimensions and support settings. */
export function NumberField({ label, value, onChange, decimals = 2, unit, step = 0.1, min = 0, max = 9999, size = 'sm', disabled, invalid, fullWidth, className, 'data-state': state }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (next: number) => {
    const clamped = Math.min(max, Math.max(min, Number.isFinite(next) ? next : value));
    onChange(Number(clamped.toFixed(decimals)));
  };

  return (
    <span className={cx(s.wrap, s[size], invalid && s.invalid, disabled && s.disabled, fullWidth && s.fullWidth, className)} data-state={state}>
      <input
        aria-label={label}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        inputMode="decimal"
        value={draft ?? value.toFixed(decimals)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null) commit(parseFloat(draft));
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            commit(value + step);
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            commit(value - step);
          }
        }}
        className={s.input}
      />
      {unit && <span className={s.unit}>{unit}</span>}
      <span className={s.steppers}>
        <button type="button" tabIndex={-1} aria-label={`Increase ${label}`} disabled={disabled} onClick={() => commit(value + step)} className={s.step}>
          <svg viewBox="0 0 8 5" fill="currentColor" aria-hidden="true">
            <path d="M4 0 L8 5 H0 Z" />
          </svg>
        </button>
        <button type="button" tabIndex={-1} aria-label={`Decrease ${label}`} disabled={disabled} onClick={() => commit(value - step)} className={s.step}>
          <svg viewBox="0 0 8 5" fill="currentColor" aria-hidden="true">
            <path d="M0 0 H8 L4 5 Z" />
          </svg>
        </button>
      </span>
    </span>
  );
}
