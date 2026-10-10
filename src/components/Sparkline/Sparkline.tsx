import type { HTMLAttributes, PointerEvent } from 'react';
import { cx } from '../../lib/cx';
import { ChartTooltip } from '../Chart/ChartTooltip';
import { formatNumber, linearScale } from '../Chart/scales';
import { useChartSize } from '../Chart/useChartSize';
import { LiveReadout, SrTable, localPoint, useActiveIndex, useSvgId, type ValueFormat } from '../LineChart/chartKit';
import k from '../LineChart/chartKit.module.css';
import s from './Sparkline.module.css';

export type SparklineTone = 'accent' | 'success' | 'danger' | 'neutral';

export type SparklineProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  data: number[];
  variant?: 'line' | 'area' | 'bar';
  tone?: SparklineTone;
  /** Fixed width in SVG units; omit to fill the container. */
  width?: number;
  /** Height in SVG units (24–32 suits a StatCard). */
  height?: number;
  /** Mark the lowest and highest values (hollow dots on lines, full-strength bars on bar variant). */
  showMinMax?: boolean;
  /** Hover / arrow-key readout of individual values. */
  interactive?: boolean;
  /** Names for each value in the tooltip and data table (e.g. week labels). */
  labels?: string[];
  valueFormat?: ValueFormat;
  /** Screen-reader summary; a trend description is generated when omitted. */
  ariaLabel?: string;
};

/**
 * Data-space geometry for a sparkline (SVG user units). Inset keeps the emphasised last point and
 * the min/max markers inside the box; radii are marker sizes.
 */
const G = { inset: 3, lastR: 2.5, extremeR: 1.75, barGap: 0.25, barRadius: 1 } as const;

/** Tiny trend without axes for StatCards: printer utilisation, resin left, failures this week. Last point is emphasised. */
export function Sparkline({
  data,
  variant = 'line',
  tone = 'accent',
  width: fixedWidth,
  height = 28,
  showMinMax = false,
  interactive = true,
  labels,
  valueFormat = formatNumber,
  ariaLabel,
  className,
  style,
  ...rest
}: SparklineProps) {
  const { ref, width: measured } = useChartSize<HTMLDivElement>(96);
  const width = fixedWidth ?? measured;
  const gid = useSvgId('pf-spark');
  const nav = useActiveIndex(interactive ? data.length : 0);
  const n = data.length;

  const min = n ? Math.min(...data) : 0;
  const max = n ? Math.max(...data) : 0;
  const bar = variant === 'bar';
  const lo = bar || variant === 'area' ? Math.min(0, min) : min;
  const hi = bar || variant === 'area' ? Math.max(0, max) : max;
  const y = linearScale(lo === hi ? [lo - 1, hi + 1] : [lo, hi], [height - G.inset, G.inset]);
  const step = n > 0 ? (width - G.inset * 2) / (bar ? n : Math.max(1, n - 1)) : 0;
  const xAt = (i: number) => (bar ? G.inset + step * (i + 0.5) : n === 1 ? width / 2 : G.inset + step * i);
  const pts = data.map((v, i) => ({ x: xAt(i), y: y(v) }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join('');
  const base = y(Math.max(lo, Math.min(hi, 0)));
  const fill = n > 1 ? `${line}L${pts[n - 1].x},${base}L${pts[0].x},${base}Z` : '';
  const iMin = data.indexOf(min);
  const iMax = data.indexOf(max);
  const name = (i: number) => labels?.[i] ?? `Point ${i + 1}`;

  const summary =
    ariaLabel ??
    (n
      ? `Trend of ${n} values, from ${valueFormat(data[0])} to ${valueFormat(data[n - 1])} (${data[n - 1] >= data[0] ? 'up' : 'down'}); low ${valueFormat(min)}, high ${valueFormat(max)}.`
      : 'No data');

  const active = nav.active;
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!interactive || !n) return;
    const { x } = localPoint(e);
    const i = bar ? Math.floor((x - G.inset) / step) : Math.round((x - G.inset) / step);
    nav.setActive(Math.max(0, Math.min(n - 1, i)));
  };

  const shown = active ?? n - 1;

  return (
    <div ref={ref} className={cx(s.root, fixedWidth !== undefined && s.fixed, s[tone], className)} style={{ ...style, ...(fixedWidth !== undefined ? { width: fixedWidth } : null) }} {...rest}>
      <svg
        className={cx(s.svg, interactive && k.focusable)}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={summary}
        tabIndex={interactive && n ? 0 : undefined}
        onKeyDown={nav.onKeyDown}
        onFocus={nav.onFocus}
        onBlur={nav.onBlur}
        onPointerMove={onPointerMove}
        onPointerLeave={() => nav.setActive(null)}
      >
        {variant === 'area' && (
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className={cx(k.gradStart, s.toneStop)} />
              <stop offset="1" className={cx(k.gradEnd, s.toneStop)} />
            </linearGradient>
          </defs>
        )}

        {n === 0 && <line className={s.baseline} x1={G.inset} x2={width - G.inset} y1={height / 2} y2={height / 2} aria-hidden="true" />}
        {bar ? (
          <g aria-hidden="true">
            {lo < 0 && <line className={s.baseline} x1={G.inset} x2={width - G.inset} y1={base} y2={base} />}
            {data.map((v, i) => {
              const top = Math.min(y(v), base);
              const h = Math.abs(y(v) - base);
              const w = Math.max(1, step * (1 - G.barGap));
              return (
                <rect
                  key={i}
                  className={cx(s.bar, s.toneFill, v >= 0 ? k.growUp : k.growDown, i !== shown && !(showMinMax && (i === iMin || i === iMax)) && s.barMuted)}
                  x={xAt(i) - w / 2}
                  y={top}
                  width={w}
                  height={Math.max(h, 1)}
                  rx={Math.min(G.barRadius, w / 2)}
                />
              );
            })}
          </g>
        ) : (
          <g aria-hidden="true">
            {variant === 'area' && fill && <path d={fill} className={k.fade} style={{ fill: `url(#${gid})` }} />}
            <path d={line} pathLength={1} className={cx(s.line, s.toneStroke, k.draw)} />
            {showMinMax && n > 1 && (
              <>
                <circle className={cx(s.extreme, s.toneStroke, k.fade)} cx={pts[iMin].x} cy={pts[iMin].y} r={G.extremeR} />
                <circle className={cx(s.extreme, s.toneStroke, k.fade)} cx={pts[iMax].x} cy={pts[iMax].y} r={G.extremeR} />
              </>
            )}
            {n > 0 && <circle className={cx(s.last, s.toneFill, k.fade)} cx={pts[shown].x} cy={pts[shown].y} r={G.lastR} />}
          </g>
        )}
      </svg>
      {interactive && active !== null && <ChartTooltip x={xAt(active)} y={Math.min(pts[active].y, base) - G.inset} rows={[{ label: name(active), value: valueFormat(data[active]), color: `var(--sparkline-tone)` }]} />}
      {interactive && <LiveReadout text={active !== null ? `${name(active)}: ${valueFormat(data[active])}` : ''} />}
      <SrTable caption={ariaLabel ?? 'Trend values'} columns={['Point', 'Value']} rows={data.map((v, i) => [name(i), valueFormat(v)])} />
    </div>
  );
}
