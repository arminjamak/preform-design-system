import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import s from './KpiIndicator.module.css';

export type KpiIndicatorProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  label: string;
  value: number | string;
  unit?: string;
  /** Change vs the previous period, as a percentage (e.g. 12 → "+12%"). Use `formatDelta` for absolute changes. */
  delta?: number;
  /** Comparison context shown after the delta, e.g. "vs last week". */
  deltaLabel?: string;
  /** Which direction is an improvement. Failed prints going down is good, so `goodDirection="down"`. */
  goodDirection?: 'up' | 'down';
  /** Goal in the same unit as `value`; draws a thin progress line (numeric `value` only). */
  target?: number;
  /** Trailing slot, typically a sparkline. */
  trend?: ReactNode;
  size?: 'sm' | 'md';
  formatValue?: (value: number) => string;
  formatDelta?: (delta: number) => string;
};

const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const defaultFormat = (v: number) => fmt.format(v);
const defaultDelta = (d: number) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${fmt.format(Math.abs(d))}%`;

/** Compact KPI: fleet dashboards, print history summaries, material usage reports. */
export function KpiIndicator({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  goodDirection = 'up',
  target,
  trend,
  size = 'md',
  formatValue = defaultFormat,
  formatDelta = defaultDelta,
  className,
  ...rest
}: KpiIndicatorProps) {
  const display = typeof value === 'number' ? formatValue(value) : value;
  const u = unit ? ` ${unit}` : '';

  const dir = delta == null || delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down';
  const quality = dir === 'flat' ? 'flat' : dir === goodDirection ? 'good' : 'bad';
  const Arrow = dir === 'up' ? ArrowUpIcon : dir === 'down' ? ArrowDownIcon : MinusIcon;
  const deltaSr =
    delta == null
      ? ''
      : `${dir === 'flat' ? 'No change' : `${dir === 'up' ? 'Up' : 'Down'} ${formatDelta(Math.abs(delta)).replace(/^[+−-]/, '')}`}${deltaLabel ? ` ${deltaLabel}` : ''}${quality === 'flat' ? '' : quality === 'good' ? ', an improvement' : ', a decline'}`;

  const numeric = typeof value === 'number';
  const pct = numeric && target != null && target > 0 ? Math.min(Math.max(value / target, 0), 1) : undefined;

  return (
    <div className={cx(s.root, s[size], className)} {...rest}>
      <p className={s.label}>{label}</p>
      <div className={s.main}>
        <span className={s.value}>
          {display}
          {unit && <span className={s.unit}>{unit}</span>}
        </span>
        {trend && <div className={s.trend}>{trend}</div>}
      </div>
      {delta != null && (
        <div className={s.delta}>
          <span className={cx(s.chip, s[quality])} aria-hidden="true">
            <Arrow strokeWidth={2.5} />
            {formatDelta(delta)}
          </span>
          {deltaLabel && <span aria-hidden="true">{deltaLabel}</span>}
          <span className={s.srOnly}>{deltaSr}</span>
        </div>
      )}
      {pct != null && target != null && (
        <div className={cx(s.target, pct >= 1 && s.reached)}>
          <div
            role="meter"
            aria-label={`${label} progress to target`}
            aria-valuemin={0}
            aria-valuemax={target}
            aria-valuenow={Math.min(value as number, target)}
            aria-valuetext={`${display}${u} of ${formatValue(target)}${u} target (${Math.round(pct * 100)}%)`}
            className={s.line}
          >
            <span className={s.lineFill} style={{ '--kpi-pct': pct } as CSSProperties} />
          </div>
          <span className={s.targetText} aria-hidden="true">
            Target {formatValue(target)}
            {u}
          </span>
        </div>
      )}
    </div>
  );
}
