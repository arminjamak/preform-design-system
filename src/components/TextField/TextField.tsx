import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import s from './TextField.module.css';

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange' | 'prefix'> &
  WithForcedState & {
    label: string;
    value: string;
    onChange: (value: string) => void;
    size?: Size;
    invalid?: boolean;
    fullWidth?: boolean;
    iconStart?: ReactNode;
    iconEnd?: ReactNode;
  };

/** Single-line text input (profile names, labels). */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, value, onChange, size = 'sm', invalid, fullWidth, iconStart, iconEnd, className, disabled, 'data-state': state, ...rest },
  ref,
) {
  return (
    <span className={cx(s.wrap, s[size], invalid && s.invalid, disabled && s.disabled, fullWidth && s.fullWidth, className)} data-state={state}>
      {iconStart && <span className={s.adornment}>{iconStart}</span>}
      <input ref={ref} aria-label={label} aria-invalid={invalid || undefined} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={s.input} {...rest} />
      {iconEnd && <span className={s.adornment}>{iconEnd}</span>}
    </span>
  );
});
