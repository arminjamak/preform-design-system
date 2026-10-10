import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import s from './Segmented.module.css';

export type SegmentedOption<T extends string> = { value: T; label: ReactNode; disabled?: boolean };

export type SegmentedProps<T extends string> = WithForcedState & {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  size?: Size;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Radio group styled as a segmented control (orientation modes, support types). */
export function Segmented<T extends string>({ label, value, options, onChange, size = 'md', fullWidth, disabled, className, 'data-state': state }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} aria-disabled={disabled || undefined} className={cx(s.group, s[size], fullWidth && s.fullWidth, className)}>
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled || o.disabled}
          data-state={i === 0 ? state : undefined}
          onClick={() => onChange(o.value)}
          className={s.option}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
