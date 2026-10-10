import { useMemo, type HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { ChartFrame } from '../Chart/ChartFrame';
import { ChartTooltip } from '../Chart/ChartTooltip';
import { Legend } from '../Chart/Legend';
import { bandScale, linearScale, niceDomain } from '../Chart/scales';
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
  useActiveIndex,
  useHiddenSeries,
  type ChartSeries,
  type ValueFormat,
} from '../LineChart/chartKit';
import k from '../LineChart/chartKit.module.css';

export type BarDatum = { label: string; values: Record<string, number | null | undefined> };

export type BarChartProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  data: BarDatum[];
  series: ChartSeries[];
  /** 'vertical' columns (default) or 'horizontal' bars. */
  orientation?: 'vertical' | 'horizontal';
  /** How multiple series share a category. */
  mode?: 'grouped' | 'stacked';
  /** Print values at the bar ends (stack totals when stacked). */
  showValues?: boolean;
  /** Plot height in SVG units. */
  height?: number;
  title?: string;
  subtitle?: string;
  valueFormat?: ValueFormat;
  showLegend?: boolean;
  /** Overrides the generated screen-reader summary. */
  ariaLabel?: string;
  emptyMessage?: string;
};

type Seg = { id: string; i: number; v: number; a: number; b: number; outer: boolean };

/** Rect with the two corners at the `end` side rounded (the end away from the baseline). */
function barPath(rx: number, ry: number, rw: number, rh: number, end: 'top' | 'bottom' | 'left' | 'right', radius: number) {
  const q = (n: number) => Math.round(n * 100) / 100;
  const [x, y, w, h] = [q(rx), q(ry), q(rw), q(rh)];
  const r = Math.max(0, Math.min(radius, (end === 'top' || end === 'bottom' ? w : h) / 2, end === 'top' || end === 'bottom' ? h : w));
  const x1 = x + w;
  const y1 = y + h;
  switch (end) {
    case 'top':
      return `M${x},${y1}V${y + r}Q${x},${y} ${x + r},${y}H${x1 - r}Q${x1},${y} ${x1},${y + r}V${y1}Z`;
    case 'bottom':
      return `M${x},${y}H${x1}V${y1 - r}Q${x1},${y1} ${x1 - r},${y1}H${x + r}Q${x},${y1} ${x},${y1 - r}Z`;
    case 'right':
      return `M${x},${y}H${x1 - r}Q${x1},${y} ${x1},${y + r}V${y1 - r}Q${x1},${y1} ${x1 - r},${y1}H${x}Z`;
    default:
      return `M${x1},${y}V${y1}H${x + r}Q${x},${y1} ${x},${y1 - r}V${y + r}Q${x},${y} ${x + r},${y}Z`;
  }
}

/** Categorical comparison: prints per week by printer, resin by material. Vertical or horizontal, grouped or stacked, negatives supported. */
export function BarChart({
  data,
  series,
  orientation = 'vertical',
  mode = 'grouped',
  showValues = false,
  height = 240,
  title,
  subtitle,
  valueFormat = defaultFormat,
  showLegend = true,
  ariaLabel,
  emptyMessage,
  className,
  ...rest
}: BarChartProps) {
  const { ref, width } = useChartSize<HTMLDivElement>();
  const { hidden, toggle } = useHiddenSeries();
  const nav = useActiveIndex(data.length);
  const horizontal = orientation === 'horizontal';
  const stacked = mode === 'stacked';

  const visible = useMemo(() => series.map((s, i) => ({ ...s, i, color: colorOf(s, i) })).filter((s) => !hidden.includes(s.id)), [series, hidden]);

  // Per-category segments in value space.
  const rows = useMemo(
    () =>
      data.map((d) => {
        let pos = 0;
        let neg = 0;
        const segs: Seg[] = visible.map((s) => {
          const v = d.values[s.id] ?? 0;
          if (!stacked) return { id: s.id, i: s.i, v, a: 0, b: v, outer: true };
          const a = v >= 0 ? pos : neg;
          if (v >= 0) pos += v;
          else neg += v;
          return { id: s.id, i: s.i, v, a, b: a + v, outer: false };
        });
        if (stacked) {
          const lastPos = [...segs].reverse().find((g) => g.v > 0);
          const lastNeg = [...segs].reverse().find((g) => g.v < 0);
          if (lastPos) lastPos.outer = true;
          if (lastNeg) lastNeg.outer = true;
        }
        return { label: d.label, segs, pos, neg, total: segs.reduce((t, g) => t + g.v, 0) };
      }),
    [data, visible, stacked],
  );

  const allValues = rows.flatMap((r) => (stacked ? [r.pos, r.neg] : r.segs.map((g) => g.v)));
  const vMin = Math.min(0, ...allValues);
  const vMax = Math.max(0, ...allValues);
  const empty = data.length === 0 || series.length === 0;

  // Layout (SVG user units).
  const categories = data.map((d) => d.label);
  const plotLen = horizontal ? width : height;
  const tickCount = Math.max(2, Math.round(plotLen / GEOM.unitsPerTick / (horizontal ? 2 : 1)));
  // Vertical value labels under negative bars need headroom below the lowest bar.
  const lowPad = showValues && !horizontal && vMin < 0 ? 1.15 : 1;
  const domain = vMin === vMax ? ([0, 1] as [number, number]) : niceDomain(vMin * lowPad, vMax, tickCount);
  const ticksPreview = linearScale(domain, [0, 1]).ticks(tickCount);
  const valueLabelRoom = showValues ? labelWidth(rows.map((r) => valueFormat(stacked ? r.total : Math.max(...r.segs.map((g) => Math.abs(g.v)), 0)))) : 0;
  const M = horizontal
    ? { top: GEOM.top, right: GEOM.right + valueLabelRoom, bottom: GEOM.tickRow, left: labelWidth(categories) + GEOM.tickGap * 2 }
    : { top: GEOM.top + (showValues ? GEOM.tickRow : 0), right: GEOM.right, bottom: GEOM.tickRow + GEOM.tickGap, left: labelWidth(ticksPreview.map(valueFormat)) + GEOM.tickGap * 2 };
  if (horizontal && showValues && vMin < 0) M.left += valueLabelRoom;
  const x0 = M.left;
  const x1 = Math.max(x0 + 1, width - M.right);
  const y0 = M.top;
  const y1 = Math.max(y0 + 1, height - M.bottom);

  const value = horizontal ? linearScale(domain, [x0, x1]) : linearScale(domain, [y1, y0]);
  const ticks = value.ticks(tickCount);
  const band = bandScale(categories, horizontal ? [y0, y1] : [x0, x1], 0.3, 0.15);
  const inner = bandScale(
    visible.map((s) => s.id),
    [0, band.bandwidth],
    stacked || visible.length < 2 ? 0 : 0.12,
    0,
  );
  const base = value(0);
  const stride = horizontal ? 1 : labelStride(categories, band.step);

  const active = nav.active;
  const fmtRows = (ri: number) => {
    const d = data[ri];
    return visible.map((s) => ({ label: s.label, value: valueFormat(d.values[s.id] ?? 0), color: s.color }));
  };

  let tip: { x: number; y: number } | null = null;
  if (active !== null) {
    const r = rows[active];
    const c = band(r.label) + band.bandwidth / 2;
    if (horizontal) tip = { x: clampX(value(r.pos), width), y: band(r.label) };
    else tip = { x: clampX(c, width), y: Math.max(y0, value(stacked ? r.pos : Math.max(0, ...r.segs.map((g) => g.v)))) };
  }

  const summary =
    ariaLabel ??
    `${horizontal ? 'Horizontal' : 'Vertical'} ${stacked ? 'stacked' : visible.length > 1 ? 'grouped' : ''} bar chart${title ? `: ${title}` : ''}. ${data.length} categories, ${visible.length} series (${visible
      .map((s) => s.label)
      .join(', ')}). Values from ${valueFormat(Math.min(...allValues, 0))} to ${valueFormat(Math.max(...allValues, 0))}.`.replace(/\s+/g, ' ');

  const legend = showLegend && series.length > 0 && (
    <Legend items={series.map((s, i) => ({ id: s.id, label: s.label, color: colorOf(s, i) }))} hidden={hidden} onToggle={toggle} />
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
              onPointerLeave={() => nav.setActive(null)}
            >
              <ValueAxis ticks={ticks} scale={value} side={horizontal ? 'bottom' : 'left'} from={horizontal ? y0 : x0} to={horizontal ? y1 : x1} format={valueFormat} />

              {active !== null &&
                (horizontal ? (
                  <rect className={k.hoverBand} x={x0} width={x1 - x0} y={band(categories[active]) - (band.step - band.bandwidth) / 2} height={band.step} />
                ) : (
                  <rect className={k.hoverBand} y={y0} height={y1 - y0} x={band(categories[active]) - (band.step - band.bandwidth) / 2} width={band.step} />
                ))}

              {/* Category labels */}
              <g aria-hidden="true">
                {categories.map((c, i) =>
                  i % stride !== 0 ? null : horizontal ? (
                    <text key={c} className={cs.tickLabel} x={x0 - GEOM.tickGap - (showValues && vMin < 0 ? valueLabelRoom : 0)} y={band(c) + band.bandwidth / 2} textAnchor="end" dominantBaseline="middle">
                      {c}
                    </text>
                  ) : (
                    <text key={c} className={cs.tickLabel} x={band(c) + band.bandwidth / 2} y={y1 + GEOM.tickGap} textAnchor="middle" dominantBaseline="hanging">
                      {c}
                    </text>
                  ),
                )}
              </g>

              {/* Bars */}
              <g aria-hidden="true">
                {rows.map((r, ri) =>
                  r.segs.map((g) => {
                    if (g.v === 0) return null;
                    const color = visible.find((s) => s.id === g.id)?.color;
                    const lo = value(Math.min(g.a, g.b));
                    const hi = value(Math.max(g.a, g.b));
                    const off = stacked ? 0 : inner(g.id);
                    const thick = stacked ? band.bandwidth : inner.bandwidth;
                    const neg = g.v < 0;
                    const r0 = g.outer ? GEOM.barRadius : 0;
                    const d = horizontal
                      ? barPath(lo, band(r.label) + off, Math.max(0, hi - lo), thick, neg ? 'left' : 'right', r0)
                      : barPath(band(r.label) + off, hi, thick, Math.max(0, lo - hi), neg ? 'bottom' : 'top', r0);
                    const grow = horizontal ? (neg ? k.growLeft : k.growRight) : neg ? k.growDown : k.growUp;
                    return <path key={`${r.label}-${g.id}`} d={d} className={cx(cs.mark, grow, active !== null && active !== ri && cs.dimmed)} style={{ fill: color }} />;
                  }),
                )}
              </g>

              {/* Zero baseline */}
              {horizontal ? <line className={cs.axisLine} x1={base} x2={base} y1={y0} y2={y1} /> : <line className={cs.axisLine} x1={x0} x2={x1} y1={base} y2={base} />}

              {/* Value labels */}
              {showValues && (
                <g aria-hidden="true" className={k.fade}>
                  {rows.flatMap((r) => {
                    const items = stacked
                      ? [{ key: 'total', v: r.total, end: r.total >= 0 ? r.pos : r.neg, off: 0, thick: band.bandwidth }]
                      : r.segs.map((g) => ({ key: g.id, v: g.v, end: g.v, off: inner(g.id), thick: inner.bandwidth }));
                    return items.map((it) => {
                      const neg = it.v < 0;
                      const p = value(it.end);
                      return horizontal ? (
                        <text key={`${r.label}-${it.key}`} className={cs.valueLabel} x={p + (neg ? -GEOM.tickGap : GEOM.tickGap) / 1.5} y={band(r.label) + it.off + it.thick / 2} textAnchor={neg ? 'end' : 'start'} dominantBaseline="middle">
                          {valueFormat(it.v)}
                        </text>
                      ) : (
                        <text key={`${r.label}-${it.key}`} className={cs.valueLabel} x={band(r.label) + it.off + it.thick / 2} y={p + (neg ? GEOM.tickGap / 1.5 : -GEOM.tickGap / 1.5)} textAnchor="middle" dominantBaseline={neg ? 'hanging' : 'auto'}>
                          {valueFormat(it.v)}
                        </text>
                      );
                    });
                  })}
                </g>
              )}

              {/* Hit targets: one per category band */}
              {categories.map((c, i) =>
                horizontal ? (
                  <rect key={c} className={k.hit} x={x0} width={x1 - x0} y={band(c) - (band.step - band.bandwidth) / 2} height={band.step} onPointerEnter={() => nav.setActive(i)} />
                ) : (
                  <rect key={c} className={k.hit} y={y0} height={y1 - y0} x={band(c) - (band.step - band.bandwidth) / 2} width={band.step} onPointerEnter={() => nav.setActive(i)} />
                ),
              )}
            </svg>
            {active !== null && tip && visible.length > 0 && <ChartTooltip x={tip.x} y={tip.y} title={data[active].label} rows={fmtRows(active)} />}
            <LiveReadout text={active !== null ? `${data[active].label}: ${fmtRows(active).map((r) => `${r.label} ${r.value}`).join(', ')}` : ''} />
            <SrTable
              caption={title ?? 'Bar chart data'}
              columns={['Category', ...series.map((s) => s.label)]}
              rows={data.map((d) => [d.label, ...series.map((s) => valueFormat(d.values[s.id] ?? 0))])}
            />
          </>
        )}
      </div>
    </ChartFrame>
  );
}
