import { useMemo, type HTMLAttributes, type PointerEvent } from 'react';
import { cx } from '../../lib/cx';
import { ChartFrame } from '../Chart/ChartFrame';
import { ChartTooltip, type ChartTooltipRow } from '../Chart/ChartTooltip';
import { Legend } from '../Chart/Legend';
import { linearScale, niceDomain } from '../Chart/scales';
import { useChartSize } from '../Chart/useChartSize';
import cs from '../Chart/Chart.module.css';
import {
  ChartEmpty,
  GEOM,
  LiveReadout,
  SrTable,
  ValueAxis,
  clampX,
  colorOf,
  defaultFormat,
  labelWidth,
  localPoint,
  useActiveIndex,
  useHiddenSeries,
  useSvgId,
  type ChartSeries,
  type ValueFormat,
} from '../LineChart/chartKit';
import k from '../LineChart/chartKit.module.css';

export type ScatterPoint = { x: number; y: number; size?: number; label?: string };
export type ScatterSeries = ChartSeries & { points: ScatterPoint[] };

export type ScatterChartProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  series: ScatterSeries[];
  xLabel?: string;
  yLabel?: string;
  /** Name of the size channel in tooltips and the data table (bubble charts). */
  sizeLabel?: string;
  /** Marker radius range in SVG units; points with `size` are scaled by area into this range. */
  sizeRange?: [number, number];
  /** Least-squares trend line per series (r² shown in the legend). */
  showTrend?: boolean;
  /** Plot height in SVG units. */
  height?: number;
  xDomain?: [number, number];
  yDomain?: [number, number];
  title?: string;
  subtitle?: string;
  xFormat?: ValueFormat;
  yFormat?: ValueFormat;
  sizeFormat?: ValueFormat;
  showLegend?: boolean;
  ariaLabel?: string;
  emptyMessage?: string;
};

type Flat = { si: number; s: ScatterSeries & { color: string; i: number }; p: ScatterPoint; px: number; py: number; r: number };

function leastSquares(pts: ScatterPoint[]) {
  const n = pts.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
    sxx += p.x * p.x;
    sxy += p.x * p.y;
    syy += p.y * p.y;
  }
  const dx = n * sxx - sx * sx;
  const dy = n * syy - sy * sy;
  if (dx === 0) return null;
  const slope = (n * sxy - sx * sy) / dx;
  const intercept = (sy - slope * sx) / n;
  const r2 = dy === 0 ? 1 : Math.pow(n * sxy - sx * sy, 2) / (dx * dy);
  return { slope, intercept, r2 };
}

/** Correlation between two measures (failure rate vs layer height, print time vs part volume). Adds a size channel for bubbles and optional trend lines. */
export function ScatterChart({
  series,
  xLabel,
  yLabel,
  sizeLabel = 'Size',
  sizeRange = [3, 14],
  showTrend = false,
  height = 240,
  xDomain,
  yDomain,
  title,
  subtitle,
  xFormat = defaultFormat,
  yFormat = defaultFormat,
  sizeFormat = defaultFormat,
  showLegend = true,
  ariaLabel,
  emptyMessage,
  className,
  ...rest
}: ScatterChartProps) {
  const { ref, width } = useChartSize<HTMLDivElement>();
  const { hidden, toggle } = useHiddenSeries();
  const clipId = useSvgId('pf-scatter-clip');

  const visible = useMemo(() => series.map((s, i) => ({ ...s, i, color: colorOf(s, i) })).filter((s) => !hidden.includes(s.id)), [series, hidden]);
  const allPts = series.flatMap((s) => s.points);
  const visPts = visible.flatMap((s) => s.points);
  const empty = allPts.length === 0;

  // Size scale by area, over every series so bubbles keep their size when a series is toggled.
  const sizes = allPts.map((p) => p.size).filter((v): v is number => v !== undefined && v >= 0);
  const bubble = sizes.length > 0;
  const sMin = bubble ? Math.sqrt(Math.min(...sizes)) : 0;
  const sMax = bubble ? Math.sqrt(Math.max(...sizes)) : 0;
  const radius = (size?: number) => (size === undefined || !bubble ? sizeRange[0] : sMax === sMin ? (sizeRange[0] + sizeRange[1]) / 2 : sizeRange[0] + ((Math.sqrt(size) - sMin) / (sMax - sMin)) * (sizeRange[1] - sizeRange[0]));

  const domainOf = (vals: number[], fixed?: [number, number], count = 5): [number, number] => {
    if (fixed) return fixed;
    if (!vals.length) return [0, 1];
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pad = bubble ? (hi - lo || 1) * 0.06 : 0;
    return niceDomain(lo - pad, hi + pad, count);
  };
  const yCount = Math.max(2, Math.round(height / GEOM.unitsPerTick));
  const yDom = domainOf(visPts.map((p) => p.y), yDomain, yCount);
  const yTicksPreview = linearScale(yDom, [0, 1]).ticks(yCount);

  const M = {
    top: GEOM.top,
    right: GEOM.right,
    bottom: GEOM.tickRow + GEOM.tickGap + (xLabel ? GEOM.axisTitle : 0),
    left: labelWidth(yTicksPreview.map(yFormat)) + GEOM.tickGap * 2 + (yLabel ? GEOM.axisTitle : 0),
  };
  const x0 = M.left;
  const x1 = Math.max(x0 + 1, width - M.right);
  const y0 = M.top;
  const y1 = Math.max(y0 + 1, height - M.bottom);
  const xCount = Math.max(2, Math.round((x1 - x0) / (GEOM.unitsPerTick * 2)));
  const xDom = domainOf(visPts.map((p) => p.x), xDomain, xCount);
  const xs = linearScale(xDom, [x0, x1]);
  const ys = linearScale(yDom, [y1, y0]);

  // Keyboard order: left to right across all visible series.
  const flat: Flat[] = visible
    .flatMap((s, si) => s.points.map((p) => ({ si, s, p, px: xs(p.x), py: ys(p.y), r: radius(p.size) })))
    .sort((a, b) => a.p.x - b.p.x || a.p.y - b.p.y);
  const nav = useActiveIndex(flat.length);
  const active = nav.active !== null ? flat[nav.active] : null;

  const trends = useMemo(() => new Map(series.map((s) => [s.id, showTrend ? leastSquares(s.points) : null])), [series, showTrend]);

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const { x, y } = localPoint(e);
    let best = -1;
    let bestD = Infinity;
    flat.forEach((f, i) => {
      const d = Math.hypot(f.px - x, f.py - y) - f.r;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const next = best >= 0 && bestD <= GEOM.unitsPerTick / 2 ? best : null;
    if (next !== nav.active) nav.setActive(next);
  };

  const rowsFor = (f: Flat): ChartTooltipRow[] => [
    { label: xLabel ?? 'x', value: xFormat(f.p.x), color: f.s.color },
    { label: yLabel ?? 'y', value: yFormat(f.p.y), color: f.s.color },
    ...(f.p.size !== undefined ? [{ label: sizeLabel, value: sizeFormat(f.p.size), color: f.s.color }] : []),
  ];

  const kind = bubble ? 'Bubble chart' : 'Scatter plot';
  const summary =
    ariaLabel ??
    `${kind}${title ? `: ${title}` : ''}. ${yLabel ?? 'y'} against ${xLabel ?? 'x'}; ${visPts.length} points in ${visible.length} series (${visible
      .map((s) => {
        const t = trends.get(s.id);
        return t ? `${s.label}, trend ${t.slope >= 0 ? 'rising' : 'falling'}, r² ${t.r2.toFixed(2)}` : s.label;
      })
      .join('; ')}).`;

  const legend = showLegend && series.length > 0 && (
    <Legend
      items={series.map((s, i) => {
        const t = trends.get(s.id);
        return { id: s.id, label: s.label, color: colorOf(s, i), value: t ? `r² ${t.r2.toFixed(2)}` : undefined };
      })}
      marker="dot"
      hidden={hidden}
      onToggle={toggle}
    />
  );

  return (
    <ChartFrame title={title} subtitle={subtitle} legend={!empty && legend} className={className}>
      <div ref={ref} className={cs.plot} {...rest}>
        {empty ? (
          <ChartEmpty height={height} message={emptyMessage} />
        ) : (
          <>
            <svg
              className={cx(cs.svg, k.focusable)}
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={summary}
              tabIndex={0}
              onKeyDown={nav.onKeyDown}
              onFocus={nav.onFocus}
              onBlur={nav.onBlur}
              onPointerMove={onPointerMove}
              onPointerLeave={() => nav.setActive(null)}
            >
              <defs>
                <clipPath id={clipId}>
                  <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} />
                </clipPath>
              </defs>
              <ValueAxis ticks={ys.ticks(yCount)} scale={ys} side="left" from={x0} to={x1} format={yFormat} />
              <ValueAxis ticks={xs.ticks(xCount)} scale={xs} side="bottom" from={y0} to={y1} format={xFormat} />
              <line className={cs.axisLine} x1={x0} x2={x1} y1={y1} y2={y1} />
              <line className={cs.axisLine} x1={x0} x2={x0} y1={y0} y2={y1} />
              {xLabel && (
                <text className={cs.axisTitle} x={(x0 + x1) / 2} y={height} textAnchor="middle" dominantBaseline="auto" aria-hidden="true">
                  {xLabel}
                </text>
              )}
              {yLabel && (
                <text className={cs.axisTitle} x={0} y={(y0 + y1) / 2} transform={`rotate(-90 0 ${(y0 + y1) / 2})`} textAnchor="middle" dominantBaseline="hanging" aria-hidden="true">
                  {yLabel}
                </text>
              )}

              {showTrend && (
                <g aria-hidden="true" clipPath={`url(#${clipId})`}>
                  {visible.map((s) => {
                    const t = trends.get(s.id);
                    if (!t || !s.points.length) return null;
                    const lo = Math.min(...s.points.map((p) => p.x));
                    const hi = Math.max(...s.points.map((p) => p.x));
                    return (
                      <line
                        key={s.id}
                        className={cx(k.trend, k.fade)}
                        x1={xs(lo)}
                        y1={ys(t.intercept + t.slope * lo)}
                        x2={xs(hi)}
                        y2={ys(t.intercept + t.slope * hi)}
                        style={{ stroke: s.color }}
                      />
                    );
                  })}
                </g>
              )}

              <g aria-hidden="true" clipPath={`url(#${clipId})`}>
                {/* Largest bubbles first so small ones stay hoverable on top. */}
                {[...flat]
                  .sort((a, b) => b.r - a.r)
                  .map((f) => (
                    <circle
                      key={`${f.s.id}-${f.p.x}-${f.p.y}-${f.p.label ?? ''}`}
                      className={cx(cs.mark, k.fade, k.noPointer, bubble ? k.bubble : k.dot, active === f && k.activeMark, active && active.s.id !== f.s.id && cs.dimmed)}
                      cx={f.px}
                      cy={f.py}
                      r={f.r}
                      style={{ fill: f.s.color, stroke: active === f ? undefined : f.s.color }}
                    />
                  ))}
              </g>
            </svg>
            {active && <ChartTooltip x={clampX(active.px, width)} y={active.py - active.r} title={active.p.label ? `${active.p.label} · ${active.s.label}` : active.s.label} rows={rowsFor(active)} />}
            <LiveReadout text={active ? `${active.p.label ?? active.s.label}: ${rowsFor(active).map((r) => `${r.label} ${r.value}`).join(', ')}` : ''} />
            <SrTable
              caption={title ?? `${kind} data`}
              columns={['Series', 'Point', xLabel ?? 'x', yLabel ?? 'y', ...(bubble ? [sizeLabel] : [])]}
              rows={series.flatMap((s) => s.points.map((p) => [s.label, p.label ?? '—', xFormat(p.x), yFormat(p.y), ...(bubble ? [p.size !== undefined ? sizeFormat(p.size) : '—'] : [])]))}
            />
          </>
        )}
      </div>
    </ChartFrame>
  );
}
