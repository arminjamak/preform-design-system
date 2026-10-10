import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './ProgressBar.module.css';

export type ProgressTone = 'accent' | 'success' | 'warning' | 'danger';

export type ProgressBarProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Current value, 0…max. Ignored while `indeterminate`. */
  value?: number;
  max?: number;
  /** Unknown duration: a segment slides across the track. */
  indeterminate?: boolean;
  /** Secondary value drawn behind the fill (e.g. layers sliced ahead of layers uploaded). */
  buffer?: number;
  size?: 'sm' | 'md';
  tone?: ProgressTone;
  /** Visible label above the bar; also its accessible name. */
  label?: ReactNode;
  /** Accessible name when no visible label is rendered. */
  'aria-label'?: string;
  /** Show the formatted value right-aligned in the header. */
  showValue?: boolean;
  /** Formats the value text (also used for `aria-valuetext`). Defaults to a rounded percentage. */
  formatValue?: (value: number, max: number) => string;
};

const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max);
const defaultFormat = (value: number, max: number) => `${Math.round((max > 0 ? value / max : 0) * 100)}%`;

/** Linear progress bar: print progress, slicing, uploads, firmware updates. */
export function ProgressBar({
  value = 0,
  max = 100,
  indeterminate,
  buffer,
  size = 'sm',
  tone = 'accent',
  label,
  showValue,
  formatValue = defaultFormat,
  className,
  'aria-label': ariaLabel,
  ...rest
}: ProgressBarProps) {
  const labelId = useId();
  const v = clamp(value, max);
  const pct = max > 0 ? v / max : 0;
  const bufferPct = buffer == null || max <= 0 ? undefined : clamp(buffer, max) / max;
  const text = formatValue(v, max);
  const hasHeader = label != null || (showValue && !indeterminate);

  return (
    <div className={cx(s.root, s[size], s[tone], indeterminate && s.indeterminate, className)} {...rest}>
      {hasHeader && (
        <div className={s.header}>
          <span id={labelId} className={s.label}>
            {label}
          </span>
          {showValue && !indeterminate && (
            <span className={s.value} aria-hidden="true">
              {text}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-labelledby={label != null ? labelId : undefined}
        aria-label={label != null ? undefined : ariaLabel ?? 'Progress'}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : v}
        aria-valuetext={indeterminate ? undefined : text}
        aria-busy={indeterminate || undefined}
        className={s.track}
        style={{ '--pb-pct': pct, '--pb-buffer': bufferPct } as CSSProperties}
      >
        {bufferPct != null && !indeterminate && <span className={s.buffer} />}
        <span className={s.fill} />
      </div>
    </div>
  );
}
