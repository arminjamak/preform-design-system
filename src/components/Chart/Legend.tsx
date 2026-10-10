import { cx } from '../../lib/cx';
import { seriesColor } from './scales';
import s from './Chart.module.css';

export type LegendItem = { id: string; label: string; color?: string; value?: string };

export type LegendProps = {
  items: LegendItem[];
  /** Marker shape: square for bars/areas, line for line series, dot for scatter. */
  marker?: 'square' | 'line' | 'dot';
  orientation?: 'horizontal' | 'vertical';
  /** When set, items become toggle buttons; ids in `hidden` render dimmed. */
  hidden?: string[];
  onToggle?: (id: string) => void;
  className?: string;
};

/** Explains series colours. Interactive when `onToggle` is provided (click to hide/show a series). */
export function Legend({ items, marker = 'square', orientation = 'horizontal', hidden = [], onToggle, className }: LegendProps) {
  return (
    <ul className={cx(s.legend, orientation === 'vertical' && s.legendVertical, className)} aria-label="Legend">
      {items.map((it, i) => {
        const sw = <span aria-hidden="true" className={cx(s.swatch, marker === 'line' && s.swatchLine, marker === 'dot' && s.swatchDot)} style={{ background: it.color ?? seriesColor(i) }} />;
        const body = (
          <>
            {sw}
            {it.label}
            {it.value && <span className={s.legendValue}>{it.value}</span>}
          </>
        );
        return (
          <li key={it.id} className={s.legendItem}>
            {onToggle ? (
              <button type="button" className={s.legendButton} aria-pressed={!hidden.includes(it.id)} onClick={() => onToggle(it.id)}>
                {body}
              </button>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}
