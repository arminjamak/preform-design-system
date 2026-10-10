import { useMemo, type HTMLAttributes, type PointerEvent } from 'react';
import { cx } from '../../lib/cx';
import { ChartFrame } from '../Chart/ChartFrame';
import { ChartTooltip } from '../Chart/ChartTooltip';
import { Legend } from '../Chart/Legend';
import { linearScale, niceDomain, niceTicks } from '../Chart/scales';
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
  labelStride,
  labelWidth,
  localPoint,
  useActiveIndex,
  useHiddenSeries,
  useSvgId,
  type ChartSeries,
  type ValueFormat,
} from './chartKit';
import k from './chartKit.module.css';

export type LineDatum = { x: string | number; values: Record<string, number | null | undefined> };

export type LineCurve = 'linear' | 'monotone';

export type LineChartProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  /** One entry per x position; a missing or null value leaves a gap in that line. */
  data: LineDatum[];
  series: ChartSeries[];
  curve?: LineCurve;
  showPoints?: boolean;
  /** Fill under each line with a gradient from the series colour to transparent. */
  area?: boolean;
  /** Stack series on top of each other (used by AreaChart). Missing values count as 0. */
  stacked?: boolean;
  /** Plot height in SVG units. */
  height?: number;
  /** Fixed value domain; otherwise a nice domain is derived from the visible series. */
  yDomain?: [number, number];
  /** Keep 0 in the derived value domain. Default true. */
  includeZero?: boolean;
  title?: string;
  subtitle?: string;
  valueFormat?: ValueFormat;
  xFormat?: (x: string | number) => string;
  showLegend?: boolean;
  ariaLabel?: string;
  emptyMessage?: string;
};

type Pt = { x: number; y: number };

const linearPath = (pts: Pt[], lead: 'M' | 'L') => pts.map((p, i) => `${i === 0 ? lead : 'L'}${p.x},${p.y}`).join('');

/** Monotone cubic interpolation in x (Fritsch–Carlson), so curves never overshoot the data. */
function monotonePath(pts: Pt[], lead: 'M' | 'L') {
  const n = pts.length;
  if (n < 3) return linearPath(pts, lead);
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    m[i] = dx[i] === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx[i];
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  }
  t[n - 1] = m[n - 2];
  let d = `${lead}${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i].x + h},${pts[i].y + t[i] * h} ${pts[i + 1].x - h},${pts[i + 1].y - t[i + 1] * h} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
}

const curvePath = (pts: Pt[], curve: LineCurve, lead: 'M' | 'L' = 'M') => (pts.length === 0 ? '' : curve === 'monotone' ? monotonePath(pts, lead) : linearPath(pts, lead));

/** Splits a sparse series into runs of consecutive defined points. */
function runs(pts: Array<Pt | null>): Pt[][] {
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  for (const p of pts) {
    if (p) cur.push(p);
    else if (cur.length) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Trends over time: prints per week, resin consumption per month. Linear or monotone curves, optional gradient area and stacking. */
export function LineChart({
  data,
  series,
  curve = 'monotone',
  showPoints = false,
  area = false,
  stacked = false,
  height = 240,
  yDomain,
  includeZero = true,
  title,
  subtitle,
  valueFormat = defaultFormat,
  xFormat = String,
  showLegend = true,
  ariaLabel,
  emptyMessage,
  className,
  ...rest
}: LineChartProps) {
  const { ref, width } = useChartSize<HTMLDivElement>();
  const { hidden, toggle } = useHiddenSeries();
  const nav = useActiveIndex(data.length);
  const gid = useSvgId('pf-line');

  const visible = useMemo(() => series.map((s, i) => ({ ...s, i, color: colorOf(s, i) })).filter((s) => !hidden.includes(s.id)), [series, hidden]);
  const empty = data.length === 0 || series.length === 0;

  // Value space: [lower, upper] per series per index (lower is the stack base, or null for plain lines).
  const layers = useMemo(() => {
    const acc = data.map(() => 0);
    return visible.map((s) =>
      data.map((d, j) => {
        const raw = d.values[s.id];
        if (stacked) {
          const lo = acc[j];
          acc[j] = lo + (raw ?? 0);
          return { lo, hi: acc[j], raw: raw ?? null };
        }
        return raw === null || raw === undefined ? null : { lo: 0, hi: raw, raw };
      }),
    );
  }, [data, visible, stacked]);

  const vals = layers.flatMap((l) => l.flatMap((p) => (p ? [p.hi, ...(stacked ? [p.lo] : [])] : [])));
  let vMin = vals.length ? Math.min(...vals) : 0;
  let vMax = vals.length ? Math.max(...vals) : 1;
  if (includeZero || area || stacked) {
    vMin = Math.min(0, vMin);
    vMax = Math.max(0, vMax);
  }
  const tickCount = Math.max(2, Math.round(height / GEOM.unitsPerTick));
  const domain: [number, number] = yDomain ?? (vMin === vMax ? niceDomain(vMin, vMax) : niceDomain(vMin, vMax, tickCount));
  const ticks = niceTicks(domain[0], domain[1], tickCount);

  const numericX = data.length > 0 && data.every((d) => typeof d.x === 'number');
  const xLabels = data.map((d) => xFormat(d.x));
  const M = { top: GEOM.top, right: GEOM.right + labelWidth([xLabels[xLabels.length - 1] ?? '']) / 3, bottom: GEOM.tickRow + GEOM.tickGap, left: labelWidth(ticks.map(valueFormat)) + GEOM.tickGap * 2 };
  const x0 = M.left;
  const x1 = Math.max(x0 + 1, width - M.right);
  const y0 = M.top;
  const y1 = Math.max(y0 + 1, height - M.bottom);
  const y = linearScale(domain, [y1, y0]);

  const xNum = data.map((d) => (typeof d.x === 'number' ? d.x : 0));
  const xDomain: [number, number] = numericX ? [Math.min(...xNum), Math.max(...xNum)] : [0, Math.max(1, data.length - 1)];
  const xs = linearScale(xDomain, data.length === 1 ? [(x0 + x1) / 2, (x0 + x1) / 2] : [x0, x1]);
  const xAt = (j: number) => xs(numericX ? xNum[j] : j);
  const xTicks = numericX ? niceTicks(xDomain[0], xDomain[1], Math.max(2, Math.round((x1 - x0) / (GEOM.unitsPerTick * 2)))) : [];
  const stride = labelStride(xLabels, data.length > 1 ? (x1 - x0) / (data.length - 1) : x1 - x0);

  const clampY = (v: number) => Math.max(y0, Math.min(y1, y(v)));
  const base = clampY(Math.max(domain[0], Math.min(domain[1], 0)));

  const geo = layers.map((l) => {
    const top = l.map((p, j) => (p ? { x: xAt(j), y: clampY(p.hi) } : null));
    const segs = runs(top);
    const line = segs.map((r) => curvePath(r, curve)).join('');
    let fill = '';
    if (area) {
      if (stacked) {
        const bottom = l.map((p, j) => ({ x: xAt(j), y: clampY(p ? p.lo : 0) }));
        const upper = top.map((p, j) => p ?? bottom[j]);
        fill = `${curvePath(upper, curve)}${curvePath([...bottom].reverse(), curve, 'L')}Z`;
      } else {
        fill = segs.map((r) => `${curvePath(r, curve)}L${r[r.length - 1].x},${base}L${r[0].x},${base}Z`).join('');
      }
    }
    return { top, line, fill };
  });

  const active = nav.active;
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!data.length) return;
    const { x } = localPoint(e);
    let best = 0;
    for (let j = 1; j < data.length; j++) if (Math.abs(xAt(j) - x) < Math.abs(xAt(best) - x)) best = j;
    if (best !== active) nav.setActive(best);
  };

  const tipRows = (j: number) =>
    visible.map((s, si) => {
      const p = layers[si][j];
      return { label: s.label, value: p ? valueFormat(p.raw ?? 0) : '—', color: s.color };
    });

  let tipY: number = y0;
  if (active !== null) {
    const ys = geo.map((g) => g.top[active]?.y).filter((v): v is number => v !== undefined);
    tipY = ys.length ? Math.min(...ys) : y0;
  }

  const kind = stacked ? 'Stacked area chart' : area ? 'Area chart' : 'Line chart';
  const summary =
    ariaLabel ??
    `${kind}${title ? `: ${title}` : ''}. ${visible.length} series over ${data.length} points${data.length ? ` from ${xLabels[0]} to ${xLabels[xLabels.length - 1]}` : ''}. ${visible
      .map((s) => {
        const last = [...data].reverse().find((d) => d.values[s.id] !== null && d.values[s.id] !== undefined);
        return last ? `${s.label} ends at ${valueFormat(last.values[s.id] as number)}` : `${s.label} has no data`;
      })
      .join('; ')}.`;

  const legend = showLegend && series.length > 0 && (
    <Legend items={series.map((s, i) => ({ id: s.id, label: s.label, color: colorOf(s, i) }))} marker={area ? 'square' : 'line'} hidden={hidden} onToggle={toggle} />
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
              {area && !stacked && (
                <defs>
                  {visible.map((s) => (
                    <linearGradient key={s.id} id={`${gid}-${s.i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" className={k.gradStart} style={{ stopColor: s.color }} />
                      <stop offset="1" className={k.gradEnd} style={{ stopColor: s.color }} />
                    </linearGradient>
                  ))}
                </defs>
              )}

              <ValueAxis ticks={ticks} scale={y} side="left" from={x0} to={x1} format={valueFormat} />

              {/* X axis labels */}
              <g aria-hidden="true">
                {numericX
                  ? xTicks.map((t) => (
                      <text key={t} className={cs.tickLabel} x={xs(t)} y={y1 + GEOM.tickGap} textAnchor="middle" dominantBaseline="hanging">
                        {xFormat(t)}
                      </text>
                    ))
                  : xLabels.map((l, j) =>
                      j % stride !== 0 ? null : (
                        <text key={j} className={cs.tickLabel} x={xAt(j)} y={y1 + GEOM.tickGap} textAnchor="middle" dominantBaseline="hanging">
                          {l}
                        </text>
                      ),
                    )}
              </g>
              <line className={cs.axisLine} x1={x0} x2={x1} y1={y1} y2={y1} />
              {domain[0] < 0 && domain[1] > 0 && <line className={cs.axisLine} x1={x0} x2={x1} y1={y(0)} y2={y(0)} />}

              {/* Areas (back to front so the first series stays on top) */}
              {area && (
                <g aria-hidden="true">
                  {visible
                    .map((s, si) => (
                      <path
                        key={s.id}
                        d={geo[si].fill}
                        className={cx(k.fade, k.noPointer, stacked && k.areaStacked)}
                        style={{ fill: stacked ? s.color : `url(#${gid}-${s.i})` }}
                      />
                    ))
                    .reverse()}
                </g>
              )}

              {active !== null && <line className={k.crosshair} x1={xAt(active)} x2={xAt(active)} y1={y0} y2={y1} />}

              {/* Lines */}
              <g aria-hidden="true">
                {visible.map((s, si) => (
                  <path key={s.id} d={geo[si].line} pathLength={1} className={cx(k.line, k.draw, k.noPointer)} style={{ stroke: s.color }} />
                ))}
              </g>

              {showPoints && (
                <g aria-hidden="true" className={k.fade}>
                  {visible.map((s, si) =>
                    geo[si].top.map((p, j) => (p ? <circle key={`${s.id}-${j}`} className={cx(k.point, k.noPointer)} cx={p.x} cy={p.y} r={GEOM.pointR} style={{ stroke: s.color }} /> : null)),
                  )}
                </g>
              )}

              {active !== null && (
                <g aria-hidden="true">
                  {visible.map((s, si) => {
                    const p = geo[si].top[active];
                    return p ? <circle key={s.id} className={k.activeDot} cx={p.x} cy={p.y} r={GEOM.activeR} style={{ fill: s.color }} /> : null;
                  })}
                </g>
              )}
            </svg>
            {active !== null && visible.length > 0 && <ChartTooltip x={clampX(xAt(active), width)} y={tipY} title={xLabels[active]} rows={tipRows(active)} />}
            <LiveReadout text={active !== null ? `${xLabels[active]}: ${tipRows(active).map((r) => `${r.label} ${r.value}`).join(', ')}` : ''} />
            <SrTable
              caption={title ?? `${kind} data`}
              columns={['X', ...series.map((s) => s.label)]}
              rows={data.map((d, j) => [xLabels[j], ...series.map((s) => (d.values[s.id] === null || d.values[s.id] === undefined ? '—' : valueFormat(d.values[s.id] as number)))])}
            />
          </>
        )}
      </div>
    </ChartFrame>
  );
}
