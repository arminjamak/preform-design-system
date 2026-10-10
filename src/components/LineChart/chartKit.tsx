/**
 * Behaviour kit shared by the PreForm charts (BarChart, LineChart, AreaChart, ScatterChart).
 * Visual chrome comes from ../Chart (scales, Legend, ChartTooltip, ChartFrame, Chart.module.css);
 * this file only adds keyboard navigation, series toggling, screen-reader output and axis rendering.
 */
import { useCallback, useId, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import { ChartColumn } from 'lucide-react';
import { formatNumber, seriesColor } from '../Chart/scales';
import cs from '../Chart/Chart.module.css';
import k from './chartKit.module.css';

export { k as chartKitStyles };

export type ChartSeries = {
  id: string;
  label: string;
  /** CSS colour reference, normally a token: `var(--color-chart-series-3)`. Defaults to the series palette by index. */
  color?: string;
};

export type ValueFormat = (v: number) => string;
export const defaultFormat: ValueFormat = formatNumber;

/**
 * Data-space geometry in SVG user units (the SVG is rendered 1:1 with CSS pixels via useChartSize).
 * These are not CSS lengths: text sizes, strokes and colours stay in CSS via the shared chart classes.
 */
export const GEOM = {
  /** Average advance of one glyph of a 10-unit tick label, used to reserve axis room. */
  charW: 6,
  /** Gap between an axis and its tick labels. */
  tickGap: 6,
  /** Height reserved for a row of tick labels under the plot. */
  tickRow: 18,
  /** Room for an axis title (x below the ticks, y left of the ticks). */
  axisTitle: 16,
  /** Target spacing between value-axis ticks. */
  unitsPerTick: 44,
  /** Corner radius of bar ends. */
  barRadius: 3,
  /** Line/area point radius and active-point radius. */
  pointR: 3,
  activeR: 4.5,
  /** Insets around the plot so edge labels and markers do not clip. */
  top: 8,
  right: 12,
} as const;

export const colorOf = (s: { color?: string }, i: number) => s.color ?? seriesColor(i);

/** A DOM-safe id for <linearGradient>/<clipPath> references. */
export function useSvgId(prefix: string) {
  const id = useId();
  return `${prefix}-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

/** Legend-driven series visibility. */
export function useHiddenSeries() {
  const [hidden, setHidden] = useState<string[]>([]);
  const toggle = useCallback((id: string) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id])), []);
  return { hidden, toggle };
}

/** Arrow-key navigation over `count` positions on a focusable plot. Escape clears; blur clears. */
export function useActiveIndex(count: number) {
  const [active, setActive] = useState<number | null>(null);
  const safe = active !== null && active < count ? active : null;
  const onKeyDown = (e: KeyboardEvent) => {
    if (!count) return;
    const cur = safe ?? -1;
    let next: number;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = Math.min(count - 1, cur + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = cur < 0 ? count - 1 : Math.max(0, cur - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      case 'Escape':
        setActive(null);
        return;
      default:
        return;
    }
    e.preventDefault();
    setActive(next);
  };
  const onFocus = (e: FocusEvent<Element>) => {
    // Only auto-select on keyboard focus; pointer focus waits for movement.
    if (count && e.currentTarget.matches(':focus-visible')) setActive((a) => a ?? 0);
  };
  const onBlur = () => setActive(null);
  return { active: safe, setActive, onKeyDown, onFocus, onBlur };
}

/** Pointer position in SVG user units (1:1 with CSS px). */
export function localPoint(e: { clientX: number; clientY: number; currentTarget: Element }) {
  const r = e.currentTarget.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

/** Width to reserve for value tick labels. */
export const labelWidth = (labels: string[]) => Math.max(0, ...labels.map((l) => l.length)) * GEOM.charW;

/** Visually hidden data table so screen readers get every value. */
export function SrTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: ReactNode[][] }) {
  return (
    <table className={k.srOnly}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th key={i} scope="col">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) =>
              j === 0 ? (
                <th key={j} scope="row">
                  {c}
                </th>
              ) : (
                <td key={j}>{c}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Polite announcement of the keyboard-active datum. */
export function LiveReadout({ text }: { text: string }) {
  return (
    <p className={k.srOnly} aria-live="polite">
      {text}
    </p>
  );
}

export function ChartEmpty({ height, message = 'No print data for this range' }: { height: number; message?: string }) {
  return (
    <div className={k.empty} style={{ height }} role="img" aria-label={message}>
      <ChartColumn className={k.emptyIcon} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

type ValueAxisProps = {
  ticks: number[];
  scale: (v: number) => number;
  /** 'left': horizontal gridlines with labels left of the plot. 'bottom': vertical gridlines with labels under it. */
  side: 'left' | 'bottom';
  /** Plot extent across the gridlines: x0..x1 for 'left', y0..y1 for 'bottom'. */
  from: number;
  to: number;
  format: ValueFormat;
};

/** Value axis: quiet gridlines plus 10-unit tick labels. The zero baseline is drawn by the chart on top. */
export function ValueAxis({ ticks, scale, side, from, to, format }: ValueAxisProps) {
  return (
    <g aria-hidden="true">
      {ticks.map((t) => {
        const p = scale(t);
        return side === 'left' ? (
          <g key={t}>
            <line className={cs.grid} x1={from} x2={to} y1={p} y2={p} />
            <text className={cs.tickLabel} x={from - GEOM.tickGap} y={p} textAnchor="end" dominantBaseline="middle">
              {format(t)}
            </text>
          </g>
        ) : (
          <g key={t}>
            <line className={cs.grid} x1={p} x2={p} y1={from} y2={to} />
            <text className={cs.tickLabel} x={p} y={to + GEOM.tickGap} textAnchor="middle" dominantBaseline="hanging">
              {format(t)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Keeps the tooltip anchor inside the plot so it does not run off the card edge. */
export const clampX = (x: number, width: number) => Math.max(Math.min(x, width - GEOM.unitsPerTick * 2), GEOM.unitsPerTick * 2);

/** Every n-th category label so labels never overlap. */
export const labelStride = (labels: string[], step: number) => Math.max(1, Math.ceil((labelWidth(labels) + GEOM.tickGap) / Math.max(1, step)));
