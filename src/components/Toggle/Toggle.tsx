import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './Toggle.module.css';

export type ToggleProps = WithForcedState & {
  /** Accessible name; also rendered when `showLabel` is set. */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
};

/** Switch used in the validation sidebar. The sm size matches the dense 20×12 app toggle. */
export function Toggle({ label, checked, onChange, size = 'sm', disabled, showLabel, className, ...rest }: ToggleProps) {
  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(s.toggle, s[size], !showLabel && className)}
      {...rest}
    >
      <span className={s.thumb} />
    </button>
  );
  if (!showLabel) return button;
  return (
    <label className={cx(s.row, className)}>
      <span className={s.label}>{label}</span>
      {button}
    </label>
  );
}
