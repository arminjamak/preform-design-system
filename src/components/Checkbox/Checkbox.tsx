import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './Checkbox.module.css';

export type CheckboxTone = 'blue' | 'green' | 'amber' | 'red' | 'orange' | 'magenta';

export type CheckboxProps = WithForcedState & {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  /** Colour-coded checkboxes (support categories, protect regions). */
  tone?: CheckboxTone;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
};

/** Compact 12px checkbox from the app's `ColorCheckbox`, with its colour mapped to accent-tone tokens. */
export function Checkbox({ label, checked, onChange, indeterminate, tone = 'blue', disabled, showLabel, className, ...rest }: CheckboxProps) {
  const box = (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(s.box, s[tone], !showLabel && className)}
      {...rest}
    >
      {indeterminate ? (
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M2.5 6 H9.5" />
        </svg>
      ) : checked ? (
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.5 6.3 L5 8.6 L9.5 3.6" />
        </svg>
      ) : null}
    </button>
  );
  if (!showLabel) return box;
  return (
    <label className={cx(s.row, className)}>
      {box}
      <span className={s.label}>{label}</span>
    </label>
  );
}
