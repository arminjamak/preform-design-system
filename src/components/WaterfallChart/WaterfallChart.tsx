import { useState, type KeyboardEvent } from 'react';
import { cx } from '../../lib/cx';
import { ChartFrame } from '../Chart/ChartFrame';
import { ChartTooltip } from '../Chart/ChartTooltip';
import { Legend } from '../Chart/Legend';
import { bandScale, formatNumber, linearScale, niceDomain } from '../Chart/scales';
import { useChartSize } from '../Chart/useChartSize';
import cs from '../Chart/Chart.module.css';
import s from './WaterfallChart.module.css';

export type WaterfallStep = {
  label: string;
  /** Change for a `delta` step; absolute level for a `total` step (the running sum continues from it). */
  value: number;
  type?: 'delta' | 'total';
};

export type WaterfallChartProps = {
  steps: WaterfallStep[];
  /** Dashed lines joining the end of each bar to the start of the next. */
  showConnectors?: boolean;
  /** Signed value label on every bar. */
  showValues?: boolean;
  showLegend?: boolean;
  valueFormat?: (v: number) => string;
  /** Plot height in px (excluding axis labels). */
  height?: number;
  yAxisTitle?: string;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
};

type Kind = 'increase' | 'decrease' | 'total';

const TONE: Record<Kind, string> = {
  increase: 'var(--color-status-success)',
  decrease: 'var(--color-status-danger)',
  total: 'var(--color-chart-series-1)',
};
const KIND_LABEL: Record<Kind, string> = { increase: 'Increase', decrease: 'Decrease', total: 'Total' };

const CHAR = 5.6;

/** Splits a label into at most two lines that fit `px`, ellipsizing the remainder. */
function wrap(label: string, px: number): string[] {
  const max = Math.max(3, Math.floor(px / CHAR));
  if (label.length <= max) return [label];
  const words = label.split(' ');
  const lines: string[] = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (!cur) lines[lines.length - 1] = w;
    else if (cur.length + 1 + w.length <= max) lines[lines.length - 1] = `${cur} ${w}`;
    else lines.push(w);
  }
  const out = lines.slice(0, 2).map((l) => (l.length > max ? `${l.slice(0, max - 1)}…` : l));
  if (lines.length > 2 && !out[1].endsWith('…')) out[1] = `${out[1].slice(0, Math.max(0, max - 1))}…`;
  return out;
}

/** Running-total chart showing how increases and decreases move a value between totals (e.g. monthly print cost). */
export function WaterfallChart({
  steps,
  showConnectors = true,
  showValues = true,
  showLegend = true,
  valueFormat = formatNumber,
  height = 200,
  yAxisTitle,
  title,
  subtitle,
  emptyMessage = 'No data to display',
  className,
}: WaterfallChartProps) {
  const { ref, width } = useChartSize<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  let run = 0;
  const bars = steps.map((st) => {
    const total = st.type === 'total';
    const start = total ? 0 : run;
    const end = total ? st.value : run + st.value;
    run = end;
    const kind: Kind = total ? 'total' : st.value >= 0 ? 'increase' : 'decrease';
    return { ...st, start, end, kind };
  });
  const isEmpty = !bars.length;

  const levels = bars.flatMap((b) => [b.start, b.end]);
  const [d0, d1] = niceDomain(Math.min(0, ...levels), Math.max(0, ...levels), 4);
  const y0 = linearScale([d0, d1], [height, 0]);
  const ticks = y0.ticks(4);
  const signed = (v: number) => (v > 0 ? `+${valueFormat(v)}` : v < 0 ? `−${valueFormat(Math.abs(v))}` : valueFormat(0));

  const ml = Math.ceil(Math.max(...ticks.map((t) => valueFormat(t).length), 1) * CHAR) + 10 + (yAxisTitle ? 14 : 0);
  const mt = showValues ? 16 : 6;
  const mr = 4;
  const x = bandScale(bars.map((_, i) => String(i)), [ml, Math.max(ml + 10, width - mr)], 0.32, 0.12);
  const lineSets = bars.map((b) => wrap(b.label, x.step - 4));
  const mb = 16 + (Math.max(1, ...lineSets.map((l) => l.length)) - 1) * 12;
  const w = width;
  const h = mt + height + mb;
  const Y = (v: number) => mt + y0(v);
  const bw = x.bandwidth;

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const n = bars.length;
    if (!n) return;
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

  const kinds = (['increase', 'decrease', 'total'] as Kind[]).filter((k) => bars.some((b) => b.kind === k));
  const legend =
    showLegend && !isEmpty ? (
      <Legend items={kinds.map((k) => ({ id: k, label: KIND_LABEL[k], color: TONE[k] }))} />
    ) : undefined;

  const describe = (i: number) => {
    const b = bars[i];
    return b.kind === 'total' ? `${b.label}: total ${valueFormat(b.end)}` : `${b.label}: ${signed(b.value)}, running total ${valueFormat(b.end)}`;
  };
  const first = bars[0];
  const last = bars[bars.length - 1];
  const summary = isEmpty
    ? ''
    : `${title ?? 'Waterfall chart'}: ${bars.length} steps from ${first.label} (${valueFormat(first.end)}) to ${last.label} (${valueFormat(last.end)}). ${bars
        .filter((b) => b.kind !== 'total')
        .map((b) => `${b.label} ${signed(b.value)}`)
        .join(', ')}.`;

  const act = active !== null ? bars[active] : undefined;

  return (
    <ChartFrame title={title} subtitle={subtitle} legend={legend} className={className}>
      <div ref={ref} className={s.plot} onPointerLeave={() => setActive(null)}>
        {isEmpty ? (
          <div className={s.empty} role="status">
            {emptyMessage}
          </div>
        ) : (
          <>
            <svg
              className={s.svg}
              width={w}
              height={h}
              viewBox={`0 0 ${w} ${h}`}
              role="img"
              aria-label={summary}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onFocus={() => setActive((a) => a ?? 0)}
              onBlur={() => setActive(null)}
            >
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={ml} x2={w - mr} y1={Y(t)} y2={Y(t)} className={t === 0 ? cs.axisLine : cs.grid} />
                  <text x={ml - 6} y={Y(t)} dominantBaseline="central" textAnchor="end" className={cs.tickLabel}>
                    {valueFormat(t)}
                  </text>
                </g>
              ))}
              {yAxisTitle && (
                <text transform={`translate(8 ${mt + height / 2}) rotate(-90)`} textAnchor="middle" className={cs.axisTitle}>
                  {yAxisTitle}
                </text>
              )}
              {showConnectors &&
                bars.slice(0, -1).map((b, i) => (
                  <line
                    key={`c${i}`}
                    x1={x(String(i)) + bw}
                    x2={x(String(i + 1))}
                    y1={Math.round(Y(b.end)) + 0.5}
                    y2={Math.round(Y(b.end)) + 0.5}
                    className={s.connector}
                  />
                ))}
              {bars.map((b, i) => {
                const bx = x(String(i));
                const top = Y(Math.max(b.start, b.end));
                const bottom = Y(Math.min(b.start, b.end));
                const on = active === i;
                const dim = active !== null && !on;
                const below = b.kind === 'decrease' || (b.kind === 'total' && b.end < 0);
                return (
                  <g key={i} onPointerEnter={() => setActive(i)}>
                    <rect x={bx - (x.step - bw) / 2} y={mt} width={x.step} height={height} className={s.hit} />
                    <rect
                      x={bx}
                      y={top}
                      width={bw}
                      height={Math.max(1, bottom - top)}
                      rx={Math.min(2, bw / 4)}
                      className={cx(cs.mark, s.bar, dim && cs.dimmed)}
                      style={{ fill: TONE[b.kind] }}
                    />
                    {showValues && (
                      <text
                        x={bx + bw / 2}
                        y={below ? bottom + 11 : top - 4}
                        textAnchor="middle"
                        className={cx(cs.valueLabel, cs.mark, dim && cs.dimmed)}
                      >
                        {b.kind === 'total' ? valueFormat(b.end) : signed(b.value)}
                      </text>
                    )}
                    <text x={bx + bw / 2} y={mt + height + 13} textAnchor="middle" className={cx(cs.tickLabel, cs.mark, dim && cs.dimmed)}>
                      {lineSets[i].map((ln, k) => (
                        <tspan key={k} x={bx + bw / 2} dy={k === 0 ? 0 : 12}>
                          {ln}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
            </svg>
            {act && active !== null && (
              <ChartTooltip
                x={x(String(active)) + bw / 2}
                y={Y(Math.max(act.start, act.end)) - (showValues ? 14 : 0)}
                title={act.label}
                rows={
                  act.kind === 'total'
                    ? [{ label: 'Total', value: valueFormat(act.end), color: TONE.total }]
                    : [
                        { label: KIND_LABEL[act.kind], value: signed(act.value), color: TONE[act.kind] },
                        { label: 'Running total', value: valueFormat(act.end), color: TONE.total },
                      ]
                }
              />
            )}
          </>
        )}
        <div className={s.srOnly} aria-live="polite">
          {active !== null && !isEmpty ? describe(active) : ''}
        </div>
        <table className={s.srOnly}>
          <caption>{title ?? 'Waterfall data'}</caption>
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">Type</th>
              <th scope="col">Change</th>
              <th scope="col">Running total</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((b, i) => (
              <tr key={`${b.label}-${i}`}>
                <th scope="row">{b.label}</th>
                <td>{KIND_LABEL[b.kind]}</td>
                <td>{b.kind === 'total' ? '–' : signed(b.value)}</td>
                <td>{valueFormat(b.end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}
