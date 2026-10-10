import { useState, type KeyboardEvent } from 'react';
import { cx } from '../../lib/cx';
import { ChartFrame } from '../Chart/ChartFrame';
import { ChartTooltip } from '../Chart/ChartTooltip';
import { bandScale, formatNumber } from '../Chart/scales';
import { useChartSize } from '../Chart/useChartSize';
import cs from '../Chart/Chart.module.css';
import s from './FunnelChart.module.css';

export type FunnelStage = { label: string; value: number; color?: string };

export type FunnelChartProps = {
  stages: FunnelStage[];
  /** `vertical` stacks stages top to bottom (classic funnel); `horizontal` runs them left to right. */
  orientation?: 'vertical' | 'horizontal';
  /** Conversion % from the previous stage, shown between stages. */
  showConversion?: boolean;
  /** Absolute drop-off annotation between stages (e.g. "−226"). */
  showDropOff?: boolean;
  valueFormat?: (v: number) => string;
  /** Bar thickness in px for the vertical layout; plot height for the horizontal layout. */
  size?: number;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
};

const CHAR = 5.6;
const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;
const clip = (t: string, px: number) => {
  const n = Math.max(3, Math.floor(px / CHAR));
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** Stage-to-stage conversion chart (e.g. Uploaded → Prepared → Queued → Printed → Post-processed). Bars are proportional to value. */
export function FunnelChart({
  stages,
  orientation = 'vertical',
  showConversion = true,
  showDropOff = true,
  valueFormat = formatNumber,
  size,
  title,
  subtitle,
  emptyMessage = 'No data to display',
  className,
}: FunnelChartProps) {
  const { ref, width } = useChartSize<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const n = stages.length;
  const max = Math.max(0, ...stages.map((d) => d.value));
  const isEmpty = !n || max <= 0;
  const first = stages[0]?.value ?? 0;
  const color = (d: FunnelStage) => d.color ?? 'var(--color-chart-series-1)';
  const between = showConversion || showDropOff;

  type Geo = { x: number; y: number; w: number; h: number };
  let geo: Geo[] = [];
  const svgW = width;
  let svgH = 0;
  // Connector polygon + annotation anchor between stage i and i + 1.
  let links: Array<{ points: string; ax: number; ay: number; dx: number; dy: number }> = [];
  let labels: Array<{ x: number; y: number; anchor: 'start' | 'middle' | 'end'; maxW: number }> = [];

  if (!isEmpty && orientation === 'vertical') {
    const bh = size ?? 28;
    const gap = between ? 24 : 6;
    const labelW = Math.min(width * 0.35, Math.ceil(Math.max(...stages.map((d) => d.label.length)) * CHAR * 1.1) + 16);
    const annotW = showDropOff ? 64 : 0;
    const area = Math.max(40, width - labelW - annotW);
    const cxm = labelW + area / 2;
    geo = stages.map((d, i) => {
      const w = Math.max(2, (Math.max(0, d.value) / max) * area);
      return { x: cxm - w / 2, y: i * (bh + gap), w, h: bh };
    });
    links = geo.slice(0, -1).map((a, i) => {
      const b = geo[i + 1];
      const y0 = a.y + a.h;
      const y1 = b.y;
      return {
        points: `${a.x},${y0} ${a.x + a.w},${y0} ${b.x + b.w},${y1} ${b.x},${y1}`,
        ax: cxm,
        ay: (y0 + y1) / 2,
        dx: labelW + area + annotW,
        dy: (y0 + y1) / 2,
      };
    });
    labels = geo.map((g) => ({ x: 0, y: g.y + g.h / 2, anchor: 'start', maxW: labelW - 8 }));
    svgH = n * bh + (n - 1) * gap;
  } else if (!isEmpty) {
    const H = size ?? 160;
    const band = bandScale(stages.map((_, i) => String(i)), [0, width], between ? 0.42 : 0.12, 0);
    const top = 4;
    geo = stages.map((d, i) => {
      const h = Math.max(2, (Math.max(0, d.value) / max) * H);
      return { x: band(String(i)), y: top + (H - h) / 2, w: band.bandwidth, h };
    });
    links = geo.slice(0, -1).map((a, i) => {
      const b = geo[i + 1];
      const x0 = a.x + a.w;
      const x1 = b.x;
      return {
        points: `${x0},${a.y} ${x1},${b.y} ${x1},${b.y + b.h} ${x0},${a.y + a.h}`,
        ax: (x0 + x1) / 2,
        ay: top + H / 2 - (showDropOff ? 7 : 0),
        dx: (x0 + x1) / 2,
        dy: top + H / 2 + (showConversion ? 8 : 0),
      };
    });
    labels = geo.map((g) => ({ x: g.x + g.w / 2, y: top + H + 12, anchor: 'middle', maxW: band.step }));
    svgH = top + H + 40;
  }

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (isEmpty) return;
    let next: number | null = active;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = active === null ? 0 : Math.min(n - 1, active + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = active === null ? 0 : Math.max(0, active - 1);
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

  const conv = (i: number) => (stages[i - 1]?.value ? stages[i].value / stages[i - 1].value : 0);
  const last = stages[n - 1];
  const summary = isEmpty
    ? ''
    : `${title ?? 'Funnel chart'}: ${n} stages from ${stages[0].label} (${valueFormat(first)}) to ${last.label} (${valueFormat(last.value)}), overall conversion ${
        first ? pct(last.value / first) : '–'
      }. ${stages
        .slice(1)
        .map((d, i) => `${d.label} ${pct(conv(i + 1))} of previous`)
        .join(', ')}.`;

  const act = active !== null ? stages[active] : undefined;
  const ag = active !== null ? geo[active] : undefined;
  const describe = (i: number) =>
    `${stages[i].label}: ${valueFormat(stages[i].value)}${i > 0 ? `, ${pct(conv(i))} of ${stages[i - 1].label}` : ''}`;

  return (
    <ChartFrame title={title} subtitle={subtitle} className={className}>
      <div ref={ref} className={s.plot} onPointerLeave={() => setActive(null)}>
        {isEmpty ? (
          <div className={s.empty} role="status">
            {emptyMessage}
          </div>
        ) : (
          <>
            <svg
              className={s.svg}
              width={svgW}
              height={svgH}
              viewBox={`0 0 ${svgW} ${svgH}`}
              role="img"
              aria-label={summary}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onFocus={() => setActive((a) => a ?? 0)}
              onBlur={() => setActive(null)}
            >
              {links.map((l, i) => (
                <polygon key={`c${i}`} points={l.points} className={s.connector} />
              ))}
              {geo.map((g, i) => (
                <rect
                  key={`b${i}`}
                  x={g.x}
                  y={g.y}
                  width={g.w}
                  height={g.h}
                  rx={Math.min(3, g.w / 2, g.h / 2)}
                  className={cx(cs.mark, s.bar, active !== null && active !== i && cs.dimmed)}
                  style={{ fill: color(stages[i]) }}
                  onPointerEnter={() => setActive(i)}
                />
              ))}
              {links.map((l, i) => {
                const lost = stages[i].value - stages[i + 1].value;
                return (
                  <g key={`a${i}`} className={cx(cs.mark, active !== null && active !== i + 1 && cs.dimmed)}>
                    {showConversion && (
                      <text x={l.ax} y={l.ay} textAnchor="middle" className={cx(cs.valueLabel, s.conversion)}>
                        {orientation === 'vertical' ? `↓ ${pct(conv(i + 1))}` : pct(conv(i + 1))}
                      </text>
                    )}
                    {showDropOff && (
                      <text
                        x={l.dx}
                        y={l.dy}
                        textAnchor={orientation === 'vertical' ? 'end' : 'middle'}
                        className={cx(cs.tickLabel, s.dropOff)}
                      >
                        {`−${valueFormat(Math.max(0, lost))}`}
                      </text>
                    )}
                  </g>
                );
              })}
              {labels.map((l, i) => (
                <g key={`l${i}`} className={cx(cs.mark, active !== null && active !== i && cs.dimmed)}>
                  <text
                    x={l.x}
                    y={orientation === 'vertical' ? l.y - 6 : l.y}
                    textAnchor={l.anchor}
                    className={cx(cs.axisTitle, s.stageLabel)}
                  >
                    {clip(stages[i].label, l.maxW)}
                  </text>
                  <text
                    x={l.x}
                    y={orientation === 'vertical' ? l.y + 7 : l.y + 14}
                    textAnchor={l.anchor}
                    className={cx(cs.tickLabel, s.stageLabel)}
                  >
                    {valueFormat(stages[i].value)}
                  </text>
                </g>
              ))}
            </svg>
            {act && ag && (
              <ChartTooltip
                x={ag.x + ag.w / 2}
                y={ag.y}
                title={act.label}
                rows={[
                  { label: 'Count', value: valueFormat(act.value), color: color(act) },
                  ...(active !== null && active > 0
                    ? [{ label: `Of ${stages[active - 1].label}`, value: pct(conv(active)), color: color(act) }]
                    : []),
                  { label: `Of ${stages[0].label}`, value: first ? pct(act.value / first) : '–', color: color(act) },
                ]}
              />
            )}
          </>
        )}
        <div className={s.srOnly} aria-live="polite">
          {active !== null && !isEmpty ? describe(active) : ''}
        </div>
        <table className={s.srOnly}>
          <caption>{title ?? 'Funnel data'}</caption>
          <thead>
            <tr>
              <th scope="col">Stage</th>
              <th scope="col">Count</th>
              <th scope="col">Conversion from previous</th>
              <th scope="col">Share of first stage</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((d, i) => (
              <tr key={`${d.label}-${i}`}>
                <th scope="row">{d.label}</th>
                <td>{valueFormat(d.value)}</td>
                <td>{i > 0 ? pct(conv(i)) : '–'}</td>
                <td>{first ? pct(d.value / first) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}
