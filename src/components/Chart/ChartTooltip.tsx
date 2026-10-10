import type { ReactNode } from 'react';
import { seriesColor } from './scales';
import s from './Chart.module.css';

export type ChartTooltipRow = { label: string; value: ReactNode; color?: string };

export type ChartTooltipProps = {
  /** Anchor point in px, relative to the chart's plot container (which must be position: relative). */
  x: number;
  y: number;
  title?: ReactNode;
  rows: ChartTooltipRow[];
  visible?: boolean;
};

/** Floating value readout shown on hover/focus of a chart mark. Position is data-driven, so it uses inline left/top. */
export function ChartTooltip({ x, y, title, rows, visible = true }: ChartTooltipProps) {
  if (!visible) return null;
  return (
    <div role="tooltip" className={s.tooltip} style={{ left: x, top: y }}>
      {title && <p className={s.tooltipTitle}>{title}</p>}
      {rows.map((r, i) => (
        <div key={r.label} className={s.tooltipRow}>
          <span aria-hidden="true" className={s.swatch} style={{ background: r.color ?? seriesColor(i) }} />
          <span className={s.tooltipLabel}>{r.label}</span>
          <span className={s.tooltipValue}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}
