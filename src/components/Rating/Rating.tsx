import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { StarIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './Rating.module.css';

export type RatingProps = WithForcedState & {
  /** Current rating. Fractions display as half stars (rounded to the nearest 0.5). */
  value: number;
  /** Omit (or set `readOnly`) for a display-only rating. */
  onChange?: (value: number) => void;
  /** Accessible name, e.g. "Print quality". */
  label: string;
  /** Number of stars. */
  max?: number;
  readOnly?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Numeric readout after the stars, e.g. "4.5". */
  showValue?: boolean;
  className?: string;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Star rating for print-quality feedback and material reviews. Interactive ratings are a `slider`
 * (arrow keys, Home/End); display ratings are a single labelled image.
 */
export function Rating({ value, onChange, label, max = 5, readOnly, disabled, size = 'md', showValue, className, ...rest }: RatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const editable = !!onChange && !readOnly;
  const interactive = editable && !disabled;
  const shown = Math.round(clamp(hover ?? value, 0, max) * 2) / 2;
  const valueText = `${Math.round(clamp(value, 0, max) * 2) / 2} out of ${max} stars`;

  const set = (v: number) => {
    if (!interactive) return;
    onChange?.(clamp(v, 0, max));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (!interactive) return;
    const whole = Math.round(value);
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowUp'
        ? whole + 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
          ? whole - 1
          : e.key === 'Home'
            ? 1
            : e.key === 'End'
              ? max
              : e.key === 'Backspace' || e.key === 'Delete'
                ? 0
                : null;
    if (next === null) return;
    e.preventDefault();
    set(next);
  };

  const a11y = editable
    ? {
        role: 'slider',
        tabIndex: disabled ? undefined : 0,
        'aria-disabled': disabled || undefined,
        'aria-valuemin': 0,
        'aria-valuemax': max,
        'aria-valuenow': Math.round(clamp(value, 0, max) * 2) / 2,
        'aria-valuetext': valueText,
        onKeyDown,
        onMouseLeave: () => setHover(null),
      }
    : {
        role: 'img',
      };

  return (
    <span
      className={cx(s.rating, s[size], editable && s.interactive, disabled && s.disabled, className)}
      aria-label={editable ? label : `${label}: ${valueText}`}
      {...a11y}
      {...rest}
    >
      <span className={s.stars}>
        {Array.from({ length: max }, (_, i) => {
          const fill = clamp(shown - i, 0, 1);
          return (
            <span
              key={i}
              className={s.star}
              style={{ '--rating-fill': fill } as CSSProperties}
              onMouseEnter={interactive ? () => setHover(i + 1) : undefined}
              onClick={interactive ? () => set(i + 1 === Math.round(value) ? 0 : i + 1) : undefined}
              aria-hidden="true"
            >
              <StarIcon className={s.empty} strokeWidth={2} />
              <span className={s.fillClip}>
                <StarIcon className={s.full} strokeWidth={2} />
              </span>
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className={s.value} aria-hidden="true">
          {(Math.round(clamp(value, 0, max) * 2) / 2).toFixed(1)}
        </span>
      )}
    </span>
  );
}
