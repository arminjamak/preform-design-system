import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import chart from '../Chart/Chart.module.css';
import type { ProgressTone } from '../ProgressBar/ProgressBar';
import s from './GaugeChart.module.css';

export type GaugeThreshold = { at: number; tone: ProgressTone };

export type GaugeChartProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  value: number;
  min?: number;
  max?: number;
  /** Draws a tick across the arc at this value (e.g. the tank's rated layer count). */
  target?: number;
  /** Tone applied from each `at` upward; the highest threshold at or below `value` wins. Defaults to accent. */
  thresholds?: GaugeThreshold[];
  /** Caption under the value; also the accessible name. */
  label?: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Show the min and max values under the arc ends. */
  showScale?: boolean;
  formatValue?: (value: number) => string;
};

/* Fixed viewBox geometry (data-derived, unitless). */
const W = 200;
const CX = 100;
const CY = 100;
const R = 84;
const TICK = 12;
const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const defaultFormat = (v: number) => fmt.format(v);

export function gaugeTone(value: number, thresholds: GaugeThreshold[] = []): ProgressTone {
  let tone: ProgressTone = 'accent';
  [...thresholds].sort((a, b) => a.at - b.at).forEach((t) => {
    if (value >= t.at) tone = t.tone;
  });
  return tone;
}

/** Semicircle gauge: tank lifetime, printer utilisation, resin temperature against its target. */
export function GaugeChart({
  value,
  min = 0,
  max = 100,
  target,
  thresholds,
  label,
  unit,
  size = 'md',
  showScale = true,
  formatValue = defaultFormat,
  className,
  ...rest
}: GaugeChartProps) {
  const span = max - min || 1;
  const frac = (v: number) => Math.min(Math.max((v - min) / span, 0), 1);
  const t = frac(value);
  const tone = gaugeTone(value, thresholds);
  const u = unit ? ` ${unit}` : '';

  let tick: { x1: number; y1: number; x2: number; y2: number } | undefined;
  if (target != null) {
    const a = Math.PI * (1 - frac(target));
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    tick = { x1: CX + (R - TICK) * cos, y1: CY - (R - TICK) * sin, x2: CX + (R + TICK) * cos, y2: CY - (R + TICK) * sin };
  }

  const valueText = `${formatValue(value)}${u}${target != null ? `, target ${formatValue(target)}${u}` : ''}`;

  return (
    <div
      role="meter"
      aria-label={label ?? 'Gauge'}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, min), max)}
      aria-valuetext={valueText}
      className={cx(chart.frame, s.root, s[size], s[tone], className)}
      {...rest}
    >
      <div className={chart.plot}>
        <svg className={cx(chart.svg, s.svg)} viewBox={`0 0 ${W} ${CY + TICK / 2 + 2}`} aria-hidden="true" focusable="false">
          <path className={s.track} d={ARC} pathLength={100} />
          {t > 0 && <path className={s.arc} d={ARC} pathLength={100} style={{ strokeDashoffset: 100 - t * 100 }} />}
          {tick && <line className={s.target} {...tick} />}
        </svg>
        <div className={s.center} aria-hidden="true">
          <span className={s.value}>
            {formatValue(value)}
            {unit && <span className={s.unit}>{unit}</span>}
          </span>
          {label && <span className={s.caption}>{label}</span>}
        </div>
      </div>
      {showScale && (
        <div className={s.scale} aria-hidden="true">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      )}
    </div>
  );
}
