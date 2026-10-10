import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { TriangleAlertIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { seriesColor } from '../Chart/scales';
import s from './UsageMeter.module.css';

export type UsageSegment = {
  id: string;
  label: string;
  value: number;
  /** CSS colour, ideally a token reference (`var(--color-chart-series-2)`). Defaults to the chart series palette. */
  color?: string;
};

export type UsageMeterAction = { label: string; onClick?: () => void; href?: string };

export type UsageMeterProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  label: ReactNode;
  /** Amount used. Ignored when `segments` is set (their sum is used). */
  value?: number;
  max: number;
  /** Unit appended to the amounts ("mL", "GB", "h"). */
  unit?: string;
  /** Split the used amount into parts (e.g. models vs supports). Renders a legend. */
  segments?: UsageSegment[];
  /** Percentage of `max` at which the meter turns warning. */
  warnAt?: number;
  /** Percentage of `max` at which the meter turns danger. */
  dangerAt?: number;
  helper?: ReactNode;
  /** Trailing link, e.g. "Order resin" or "Manage storage". */
  action?: UsageMeterAction;
  size?: 'sm' | 'md';
  /** Number formatter for amounts. Defaults to up to one decimal. */
  formatValue?: (value: number) => string;
};

const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const defaultFormat = (v: number) => fmt.format(v);

/** Usage against a quota with threshold tones: resin cartridge level, cloud storage, monthly print hours. */
export function UsageMeter({
  label,
  value = 0,
  max,
  unit,
  segments,
  warnAt = 80,
  dangerAt = 95,
  helper,
  action,
  size = 'sm',
  formatValue = defaultFormat,
  className,
  ...rest
}: UsageMeterProps) {
  const labelId = useId();
  const helperId = useId();
  const used = segments ? segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0) : Math.max(0, value);
  const pct = max > 0 ? (used / max) * 100 : 0;
  const tone = pct >= dangerAt ? 'danger' : pct >= warnAt ? 'warning' : 'accent';
  const u = unit ? ` ${unit}` : '';
  const valueText = `${formatValue(used)} of ${formatValue(max)}${u} (${Math.round(pct)}%)`;

  // Bar widths are fractions of max, scaled down so an over-quota total never overflows the track.
  const scale = max > 0 ? 1 / Math.max(max, used) : 0;
  const parts = segments
    ? segments.map((seg, i) => ({ ...seg, frac: Math.max(0, seg.value) * scale, fill: seg.color ?? seriesColor(i) }))
    : [{ id: 'used', label: '', value: used, frac: used * scale, fill: undefined as string | undefined }];

  return (
    <div className={cx(s.root, s[size], s[tone], className)} {...rest}>
      <div className={s.header}>
        <span id={labelId} className={s.label}>
          {label}
        </span>
        <span className={s.amount} aria-hidden="true">
          {tone !== 'accent' && <TriangleAlertIcon />}
          <span className={s.used}>{formatValue(used)}</span> / {formatValue(max)}
          {u}
        </span>
      </div>
      <div
        role="meter"
        aria-labelledby={labelId}
        aria-describedby={helper ? helperId : undefined}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(used, max)}
        aria-valuetext={tone === 'accent' ? valueText : `${valueText}, ${tone === 'danger' ? 'almost full' : 'running low'}`}
        className={cx(s.track, !segments && s.single)}
      >
        {parts.filter((p) => p.frac > 0).map((p) => (
          <span key={p.id} className={s.segment} style={{ '--um-pct': p.frac, '--um-fill': p.fill } as CSSProperties} />
        ))}
      </div>
      {segments && (
        <ul className={s.legend} aria-label="Breakdown">
          {parts.map((p) => (
            <li key={p.id} className={s.legendItem}>
              <span aria-hidden="true" className={s.swatch} style={{ background: p.fill }} />
              {p.label}
              <span className={s.legendValue}>
                {formatValue(p.value)}
                {u}
              </span>
            </li>
          ))}
        </ul>
      )}
      {(helper || action) && (
        <div className={s.footer}>
          {helper ? (
            <p id={helperId} className={s.helper}>
              {helper}
            </p>
          ) : (
            <span />
          )}
          {action &&
            (action.href ? (
              <a href={action.href} className={cx(s.action, s.link)} onClick={action.onClick}>
                {action.label}
              </a>
            ) : (
              <Button variant="link" size="sm" className={s.action} onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}
