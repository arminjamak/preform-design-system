import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import type { ProgressTone } from '../ProgressBar/ProgressBar';
import s from './CircularProgress.module.css';

export type CircularProgressProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Percentage complete, 0…100. Ignored while `indeterminate`. */
  value?: number;
  /** xs–lg follow the icon sizes (12–24); xl is the 40px control size and the only one with room for value text. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  tone?: ProgressTone;
  indeterminate?: boolean;
  /** Accessible name, e.g. "Uploading Form 4 job". */
  label?: string;
  /** Centred percentage text (rendered at size xl only). */
  showValue?: boolean;
};

/** Ring progress: compact upload/slicing status in list rows, toolbars and job cards. */
export function CircularProgress({ value = 0, size = 'md', tone = 'accent', indeterminate, label = 'Progress', showValue, className, ...rest }: CircularProgressProps) {
  const v = Math.min(Math.max(value, 0), 100);
  const rounded = Math.round(v);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : rounded}
      aria-valuetext={indeterminate ? undefined : `${rounded}%`}
      aria-busy={indeterminate || undefined}
      className={cx(s.root, s[size], s[tone], indeterminate && s.indeterminate, className)}
      {...rest}
    >
      <svg className={s.svg} aria-hidden="true" focusable="false">
        <circle className={s.track} cx="50%" cy="50%" />
        <circle className={s.arc} cx="50%" cy="50%" pathLength={100} style={indeterminate ? undefined : { strokeDashoffset: 100 - v, opacity: v === 0 ? 0 : undefined }} />
      </svg>
      {showValue && size === 'xl' && !indeterminate && (
        <span className={s.value} aria-hidden="true">
          {rounded}%
        </span>
      )}
    </div>
  );
}
