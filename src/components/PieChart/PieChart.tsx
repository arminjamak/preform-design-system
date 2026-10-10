import { useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { cx } from '../../lib/cx';
import { ChartFrame } from '../Chart/ChartFrame';
import { ChartTooltip } from '../Chart/ChartTooltip';
import { Legend } from '../Chart/Legend';
import { formatNumber, seriesColor } from '../Chart/scales';
import { useChartSize } from '../Chart/useChartSize';
import cs from '../Chart/Chart.module.css';
import s from './PieChart.module.css';

export type PieChartDatum = { id: string; label: string; value: number; color?: string };

export type PieChartProps = {
  data: PieChartDatum[];
  /** Render as a donut. Shorthand for `innerRadius={0.6}` when `innerRadius` is not set. */
  donut?: boolean;
  /** Inner radius as a ratio of the outer radius, 0–0.9. 0 = pie. */
  innerRadius?: number;
  /** Gap between slices in px (constant width along the seam). */
  gap?: number;
  /** How far the hovered / focused slice moves out along its bisector, in px. */
  hoverOffset?: number;
  /** Percentage labels outside each slice (slices under 3% are skipped). */
  showLabels?: boolean;
  showLegend?: boolean;
  /** What the legend shows after each label. */
  legendValue?: 'percent' | 'value' | 'none';
  legendPosition?: 'right' | 'bottom';
  /** Donut centre caption. Defaults to "Total"; replaced by the active slice label on hover. */
  centerLabel?: string;
  /** Donut centre value. Defaults to the formatted total; replaced by the active slice share on hover. */
  centerValue?: string;
  /** Pie diameter in px; shrinks to fit narrow containers. */
  size?: number;
  title?: string;
  subtitle?: string;
  valueFormat?: (v: number) => string;
  emptyMessage?: string;
  className?: string;
};

const TAU = Math.PI * 2;
/** Point at radius r and angle a (0 = 12 o'clock, clockwise). */
const pt = (r: number, a: number): [number, number] => [r * Math.sin(a), -r * Math.cos(a)];
const f2 = (n: number) => Math.round(n * 100) / 100;
const P = ([x, y]: [number, number]) => `${f2(x)} ${f2(y)}`;

/** Annular sector path centred on 0,0 with a constant-width gap of `gap` px between neighbours. */
function slicePath(a0: number, a1: number, R: number, ri: number, gap: number): string | null {
  const theta = a1 - a0;
  if (theta <= 0) return null;
  if (theta >= TAU - 1e-6) {
    const outer = `M0 ${-R}A${R} ${R} 0 1 1 0 ${R}A${R} ${R} 0 1 1 0 ${-R}Z`;
    return ri > 0 ? `${outer}M0 ${-ri}A${ri} ${ri} 0 1 0 0 ${ri}A${ri} ${ri} 0 1 0 0 ${-ri}Z` : outer;
  }
  const h = gap / 2;
  const po = h > 0 ? Math.asin(Math.min(1, h / R)) : 0;
  if (2 * po >= theta) return null;
  const o0 = a0 + po;
  const o1 = a1 - po;
  let d = `M${P(pt(R, o0))}A${R} ${R} 0 ${o1 - o0 > Math.PI ? 1 : 0} 1 ${P(pt(R, o1))}`;
  const pin = ri > 0 && h > 0 ? Math.asin(Math.min(1, h / ri)) : 0;
  if (ri > 0 && 2 * pin < theta) {
    const i0 = a0 + pin;
    const i1 = a1 - pin;
    d += `L${P(pt(ri, i1))}A${ri} ${ri} 0 ${i1 - i0 > Math.PI ? 1 : 0} 0 ${P(pt(ri, i0))}Z`;
  } else if (h === 0) {
    d += 'L0 0Z';
  } else if (theta < Math.PI) {
    d += `L${P(pt(h / Math.sin(theta / 2), (a0 + a1) / 2))}Z`;
  } else {
    d += `L${P(pt(h, a1 - Math.PI / 2))}L${P(pt(h, a0 + Math.PI / 2))}Z`;
  }
  return d;
}

const pct = (v: number) => `${v >= 0.1 ? Math.round(v * 100) : Math.round(v * 1000) / 10}%`;

/** Pie and donut chart for part-to-whole data (e.g. resin usage by material). Slices use the categorical chart series tokens. */
export function PieChart({
  data,
  donut = false,
  innerRadius,
  gap = 2,
  hoverOffset = 6,
  showLabels = true,
  showLegend = true,
  legendValue = 'percent',
  legendPosition = 'right',
  centerLabel,
  centerValue,
  size = 200,
  title,
  subtitle,
  valueFormat = formatNumber,
  emptyMessage = 'No data to display',
  className,
}: PieChartProps) {
  const { ref, width } = useChartSize<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);

  const colored = useMemo(() => data.map((d, i) => ({ ...d, color: d.color ?? seriesColor(i) })), [data]);
  const visible = colored.filter((d) => !hidden.includes(d.id) && d.value > 0);
  const total = visible.reduce((a, d) => a + d.value, 0);
  const fullTotal = colored.reduce((a, d) => a + Math.max(0, d.value), 0);

  const ratio = Math.max(0, Math.min(0.9, innerRadius ?? (donut ? 0.6 : 0)));
  const padX = hoverOffset + (showLabels ? 34 : 4);
  const padY = hoverOffset + (showLabels ? 16 : 4);
  const D = Math.max(80, Math.min(size, width - padX * 2));
  const R = D / 2;
  const ri = R * ratio;
  const w = D + padX * 2;
  const h = D + padY * 2;
  const cxp = w / 2;
  const cyp = h / 2;

  let acc = 0;
  const slices = visible.map((d) => {
    const a0 = total ? (acc / total) * TAU : 0;
    acc += d.value;
    const a1 = total ? (acc / total) * TAU : 0;
    const mid = (a0 + a1) / 2;
    return { ...d, a0, a1, mid, share: total ? d.value / total : 0, path: slicePath(a0, a1, R, ri, visible.length > 1 ? gap : 0) };
  });

  const toggle = (id: string) => {
    setActive(null);
    setHidden((hs) => {
      if (hs.includes(id)) return hs.filter((x) => x !== id);
      const remaining = colored.filter((d) => d.value > 0 && !hs.includes(d.id) && d.id !== id);
      return remaining.length ? [...hs, id] : hs;
    });
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const n = slices.length;
    if (!n) return;
    let next: number | null = active;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = active === null ? 0 : (active + 1) % n;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = active === null ? n - 1 : (active - 1 + n) % n;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = n - 1;
        break;
      case 'Escape':
        next = null;
        break;
      default:
        return;
    }
    e.preventDefault();
    setActive(next);
  };

  const act = active !== null ? slices[active] : undefined;
  const legend = showLegend ? (
    <Legend
      orientation={legendPosition === 'right' ? 'vertical' : 'horizontal'}
      items={colored.map((d) => ({
        id: d.id,
        label: d.label,
        color: d.color,
        value:
          legendValue === 'none'
            ? undefined
            : legendValue === 'value'
              ? valueFormat(d.value)
              : hidden.includes(d.id) || !total
                ? '–'
                : pct(Math.max(0, d.value) / total),
      }))}
      hidden={hidden}
      onToggle={toggle}
    />
  ) : null;

  const top = [...slices].sort((a, b) => b.value - a.value).slice(0, 3);
  const summary = `${title ?? (ratio > 0 ? 'Donut chart' : 'Pie chart')}: ${slices.length} segments, total ${valueFormat(total)}. ${top
    .map((d) => `${d.label} ${pct(d.share)}`)
    .join(', ')}${slices.length > 3 ? ', …' : ''}.`;

  const isEmpty = fullTotal <= 0;
  const showCenter = ratio >= 0.4 && !isEmpty;
  // Anchor at the outer edge so the tooltip never hides the donut centre readout.
  const anchorR = R + 2;

  return (
    <ChartFrame title={title} subtitle={subtitle} className={className}>
      <div ref={ref} className={cx(s.layout, legendPosition === 'bottom' && s.layoutBottom)}>
        {isEmpty ? (
          <div className={s.empty} role="status">
            {emptyMessage}
          </div>
        ) : (
          <div className={s.plot} style={{ width: w, height: h }} onPointerLeave={() => setActive(null)}>
            <svg
              className={s.svg}
              width={w}
              height={h}
              viewBox={`0 0 ${w} ${h}`}
              role="img"
              aria-label={summary}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onFocus={() => setActive((a) => (a === null ? 0 : a))}
              onBlur={() => setActive(null)}
            >
              <g transform={`translate(${cxp} ${cyp})`}>
                {slices.map((d, i) => {
                  if (!d.path) return null;
                  const on = active === i;
                  const [dx, dy] = on ? pt(hoverOffset, d.mid) : [0, 0];
                  return (
                    <path
                      key={d.id}
                      d={d.path}
                      fillRule="evenodd"
                      className={cx(cs.mark, s.slice, active !== null && !on && cs.dimmed)}
                      style={{ fill: d.color, '--pie-dx': f2(dx), '--pie-dy': f2(dy) } as CSSProperties}
                      onPointerEnter={() => setActive(i)}
                    />
                  );
                })}
                {showLabels &&
                  slices.map((d, i) => {
                    if (d.share < 0.03) return null;
                    const on = active === i;
                    const [x, y] = pt(R + 10 + (on ? hoverOffset : 0), d.mid);
                    const sx = Math.sin(d.mid);
                    return (
                      <text
                        key={d.id}
                        x={f2(x)}
                        y={f2(y)}
                        textAnchor={sx > 0.15 ? 'start' : sx < -0.15 ? 'end' : 'middle'}
                        className={cx(cs.valueLabel, s.label, active !== null && !on && cs.dimmed)}
                      >
                        {pct(d.share)}
                      </text>
                    );
                  })}
                {showCenter && (
                  <>
                    <text y={-2} textAnchor="middle" className={s.centerValue}>
                      {act ? pct(act.share) : (centerValue ?? valueFormat(total))}
                    </text>
                    <text y={14} textAnchor="middle" className={s.centerLabel}>
                      {act ? act.label : (centerLabel ?? 'Total')}
                    </text>
                  </>
                )}
              </g>
            </svg>
            {act && (
              <ChartTooltip
                x={cxp + pt(anchorR + hoverOffset, act.mid)[0]}
                y={cyp + pt(anchorR + hoverOffset, act.mid)[1]}
                title={act.label}
                rows={[
                  { label: 'Value', value: valueFormat(act.value), color: act.color },
                  { label: 'Share', value: pct(act.share), color: act.color },
                ]}
              />
            )}
          </div>
        )}
        {legend}
        <div className={s.srOnly} aria-live="polite">
          {act ? `${act.label}: ${valueFormat(act.value)}, ${pct(act.share)}` : ''}
        </div>
        <table className={s.srOnly}>
          <caption>{title ?? 'Chart data'}</caption>
          <thead>
            <tr>
              <th scope="col">Segment</th>
              <th scope="col">Value</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {colored.map((d) => (
              <tr key={d.id}>
                <th scope="row">{d.label}</th>
                <td>{valueFormat(d.value)}</td>
                <td>{fullTotal ? pct(Math.max(0, d.value) / fullTotal) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}
