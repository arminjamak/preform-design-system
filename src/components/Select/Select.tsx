import type { SelectHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import s from './Select.module.css';

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size' | 'value'> &
  WithForcedState & {
    label: string;
    value: string;
    options: Array<string | SelectOption>;
    onChange: (value: string) => void;
    size?: Size;
    invalid?: boolean;
    fullWidth?: boolean;
  };

/** Native select with the app's custom caret. Options may be plain strings. */
export function Select({ label, value, options, onChange, size = 'sm', invalid, fullWidth, className, disabled, 'data-state': state, ...rest }: SelectProps) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <span className={cx(s.wrap, s[size], invalid && s.invalid, fullWidth && s.fullWidth, className)}>
      <select aria-label={label} aria-invalid={invalid || undefined} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={s.select} data-state={state} {...rest}>
        {opts.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 8 5" className={s.caret} fill="currentColor" aria-hidden="true">
        <path d="M0 0 H8 L4 5 Z" />
      </svg>
    </span>
  );
}
