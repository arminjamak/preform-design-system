import { useState, type KeyboardEvent } from 'react';
import { cx } from '../../lib/cx';
import { ChartFrame } from '../Chart/ChartFrame';
import { ChartTooltip } from '../Chart/ChartTooltip';
import { formatNumber, sequentialColor } from '../Chart/scales';
import { useChartSize } from '../Chart/useChartSize';
import cs from '../Chart/Chart.module.css';
import s from './Heatmap.module.css';

export type HeatmapProps = {
  /** Column categories (e.g. hours of the day). */
  xLabels: string[];
  /** Row categories (e.g. weekdays). */
  yLabels: string[];
  /** Matrix indexed `values[row][column]`; `null` marks a missing cell. */
  values: Array<Array<number | null>>;
  /** Print the value inside each cell (hidden automatically when cells are too narrow). */
  showValues?: boolean;
  valueFormat?: (v: number) => string;
  /** Gap between cells in px. */
  cellGap?: number;
  /** Row height in px. */
  cellHeight?: number;
  /** Colour domain; defaults to the data min/max. */
  domain?: [number, number];
  /** Show the colour-scale legend bar. */
  showScale?: boolean;
  /** Caption before the colour-scale bar (e.g. "Utilisation"). */
  scaleLabel?: string;
  xAxisTitle?: string;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
};

type Cell = { r: number; c: number };

const CHAR = 5.6; // approx. advance of a 10px label glyph, for layout estimates only

/** Matrix of cells coloured on the sequential chart ramp (e.g. printer utilisation by weekday × hour). */
export function Heatmap({
  xLabels,
  yLabels,
  values,
  showValues = false,
  valueFormat = formatNumber,
  cellGap = 2,
  cellHeight = 24,
  domain,
  showScale = true,
  scaleLabel,
  xAxisTitle,
  title,
  subtitle,
  emptyMessage = 'No data to display',
  className,
}: HeatmapProps) {
  const { ref, width } = useChartSize<HTMLDivElement>();
  const [active, setActive] = useState<Cell | null>(null);

  const nx = xLabels.length;
  const ny = yLabels.length;
  const at = (r: number, c: number): number | null => {
    const v = values[r]?.[c];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  };
  const flat: number[] = [];
  for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) {
    const v = at(r, c);
    if (v !== null) flat.push(v);
  }
  const isEmpty = !nx || !ny || !flat.length;
  const lo = domain?.[0] ?? (flat.length ? Math.min(...flat) : 0);
  const hi = domain?.[1] ?? (flat.length ? Math.max(...flat) : 1);
  const norm = (v: number) => (hi === lo ? 0.5 : Math.max(0, Math.min(1, (v - lo) / (hi - lo))));

  const ml = Math.ceil(Math.max(0, ...yLabels.map((l) => l.length)) * CHAR) + 8;
  const mt = 2;
  const mb = 18 + (xAxisTitle ? 16 : 0);
  const plotW = Math.max(nx * 6, width - ml - 2);
  const cw = nx ? plotW / nx : 0;
  const ch = cellHeight;
  const w = ml + plotW;
  const h = mt + ny * ch + mb;
  const xEvery = Math.max(1, Math.ceil((Math.max(1, ...xLabels.map((l) => l.length)) * CHAR + 6) / Math.max(1, cw)));
  const g = Math.min(cellGap, cw / 3, ch / 3);
  const rx = Math.min(2, (cw - g) / 4);

  const peak = (() => {
    let best: (Cell & { v: number }) | null = null;
    for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) {
      const v = at(r, c);
      if (v !== null && (!best || v > best.v)) best = { r, c, v };
    }
    return best;
  })();

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (isEmpty) return;
    const cur = active ?? { r: 0, c: 0 };
    let next: Cell | null = cur;
    switch (e.key) {
      case 'ArrowRight':
        next = { r: cur.r, c: Math.min(nx - 1, cur.c + 1) };
        break;
      case 'ArrowLeft':
        next = { r: cur.r, c: Math.max(0, cur.c - 1) };
        break;
      case 'ArrowDown':
        next = { r: Math.min(ny - 1, cur.r + 1), c: cur.c };
        break;
      case 'ArrowUp':
        next = { r: Math.max(0, cur.r - 1), c: cur.c };
        break;
      case 'Home':
        next = { r: e.ctrlKey ? 0 : cur.r, c: 0 };
        break;
      case 'End':
        next = { r: e.ctrlKey ? ny - 1 : cur.r, c: nx - 1 };
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

  const activeValue = active ? at(active.r, active.c) : null;
  const describe = (c: Cell) => {
    const v = at(c.r, c.c);
    return `${yLabels[c.r]} ${xLabels[c.c]}: ${v === null ? 'no data' : valueFormat(v)}`;
  };
  const summary = `${title ?? 'Heatmap'}: ${ny} rows by ${nx} columns, values from ${valueFormat(lo)} to ${valueFormat(hi)}.${
    peak ? ` Highest: ${describe(peak)}.` : ''
  } Use arrow keys to move between cells.`;

  const scale = showScale && !isEmpty ? (
    <div className={s.scale} aria-hidden="true">
      {scaleLabel && <span className={s.scaleTitle}>{scaleLabel}</span>}
      <span>{valueFormat(lo)}</span>
      <span className={s.scaleBar}>
        {activeValue !== null && <span className={s.scaleMarker} style={{ left: `${norm(activeValue) * 100}%` }} />}
      </span>
      <span>{valueFormat(hi)}</span>
    </div>
  ) : null;

  return (
    <ChartFrame title={title} subtitle={subtitle} legend={scale} className={className}>
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
              onFocus={() => setActive((a) => a ?? { r: 0, c: 0 })}
              onBlur={() => setActive(null)}
            >
              {yLabels.map((l, r) => (
                <text
                  key={`y${r}`}
                  x={ml - 6}
                  y={mt + r * ch + ch / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  className={cx(cs.tickLabel, active?.r === r && s.labelActive)}
                >
                  {l}
                </text>
              ))}
              {xLabels.map((l, c) =>
                c % xEvery === 0 ? (
                  <text
                    key={`x${c}`}
                    x={ml + c * cw + cw / 2}
                    y={mt + ny * ch + 12}
                    textAnchor="middle"
                    className={cx(cs.tickLabel, active?.c === c && s.labelActive)}
                  >
                    {l}
                  </text>
                ) : null,
              )}
              {xAxisTitle && (
                <text x={ml + plotW / 2} y={h - 2} textAnchor="middle" className={cs.axisTitle}>
                  {xAxisTitle}
                </text>
              )}
              {yLabels.map((_, r) =>
                xLabels.map((__, c) => {
                  const v = at(r, c);
                  const t = v === null ? 0 : norm(v);
                  const on = active?.r === r && active?.c === c;
                  const x = ml + c * cw + g / 2;
                  const y = mt + r * ch + g / 2;
                  const label = v === null ? '' : valueFormat(v);
                  const fits = showValues && label.length * CHAR + 4 <= cw - g;
                  return (
                    <g key={`${r}-${c}`} onPointerEnter={() => setActive({ r, c })}>
                      <rect
                        x={x}
                        y={y}
                        width={Math.max(0, cw - g)}
                        height={Math.max(0, ch - g)}
                        rx={rx}
                        className={cx(s.cell, v === null && s.cellEmpty, on && s.cellActive)}
                        style={v === null ? undefined : { fill: sequentialColor(t) }}
                      />
                      {fits && (
                        <text
                          x={x + (cw - g) / 2}
                          y={y + (ch - g) / 2}
                          textAnchor="middle"
                          className={cx(cs.valueLabel, s.cellValue, t > 0.55 && s.onHigh)}
                        >
                          {label}
                        </text>
                      )}
                    </g>
                  );
                }),
              )}
            </svg>
            {active && (
              <ChartTooltip
                x={ml + active.c * cw + cw / 2}
                y={mt + active.r * ch + g / 2}
                title={`${yLabels[active.r]} · ${xLabels[active.c]}`}
                rows={[
                  {
                    label: scaleLabel ?? 'Value',
                    value: activeValue === null ? 'No data' : valueFormat(activeValue),
                    color: activeValue === null ? 'var(--color-chart-track)' : sequentialColor(norm(activeValue)),
                  },
                ]}
              />
            )}
          </>
        )}
        <div className={s.srOnly} aria-live="polite">
          {active ? describe(active) : ''}
        </div>
        <table className={s.srOnly}>
          <caption>{title ?? 'Heatmap data'}</caption>
          <thead>
            <tr>
              <td />
              {xLabels.map((l, c) => (
                <th key={c} scope="col">
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yLabels.map((l, r) => (
              <tr key={r}>
                <th scope="row">{l}</th>
                {xLabels.map((_, c) => {
                  const v = at(r, c);
                  return <td key={c}>{v === null ? '–' : valueFormat(v)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}
