import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { space, type SpaceValue, type StyleWithVars, type TokenLength } from '../Stack/space';
import s from './Grid.module.css';

/** Column count per container width. Breakpoints: sm ≥ 1.5 × panel, md ≥ 2.5 × panel, lg ≥ 3.5 × panel (`--size-layout-panel`). Missing steps inherit the previous one. */
export type GridColumns = number | { base: number; sm?: number; md?: number; lg?: number };

/** Named layout sizes for `minItemWidth`, or any token expression. */
export type GridMinItemWidth = 'field-lg' | 'menu-min' | 'sidebar' | 'panel' | 'dialog-sm' | 'dialog-md' | 'dialog-lg' | TokenLength;

const MIN_WIDTH: Record<Exclude<GridMinItemWidth, TokenLength>, string> = {
  'field-lg': 'var(--size-field-lg)',
  'menu-min': 'var(--size-layout-menu-min)',
  sidebar: 'var(--size-layout-sidebar)',
  panel: 'var(--size-layout-panel)',
  'dialog-sm': 'var(--size-layout-dialog-sm)',
  'dialog-md': 'var(--size-layout-dialog-md)',
  'dialog-lg': 'var(--size-layout-dialog-lg)',
};

export type GridProps = HTMLAttributes<HTMLDivElement> & {
  /** Fixed count, or a responsive map keyed by container width. Counts should not decrease at wider steps. Default `{ base: 1, sm: 2, md: 3, lg: 4 }`. */
  columns?: GridColumns;
  /** Auto-fill as many columns as fit, each at least this wide. Overrides `columns`. */
  minItemWidth?: GridMinItemWidth;
  /** Gap between cells as a `--space-*` step. Default `3`. */
  gap?: SpaceValue;
  /** Row gap when it should differ from `gap`. */
  rowGap?: SpaceValue;
  /** Vertical alignment of cells inside their row. Default `stretch`. */
  align?: 'start' | 'center' | 'end' | 'stretch';
};

const DEFAULT_COLUMNS: GridColumns = { base: 1, sm: 2, md: 3, lg: 4 };

/**
 * Responsive grid that responds to its own container width (not the viewport), for model cards, material swatches and printer tiles.
 * `className`, `style` and `ref` go on the outer size container; `role` goes on the grid itself so `role="list"` wraps the items directly.
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { columns = DEFAULT_COLUMNS, minItemWidth, gap, rowGap, align, role, className, style, children, ...rest },
  ref,
) {
  const responsive = typeof columns === 'object';
  const base = Math.max(1, Math.round(responsive ? columns.base : columns));
  const sm = responsive ? Math.max(1, Math.round(columns.sm ?? base)) : base;
  const md = responsive ? Math.max(1, Math.round(columns.md ?? sm)) : sm;
  const lg = responsive ? Math.max(1, Math.round(columns.lg ?? md)) : md;
  const vars: StyleWithVars = {
    '--grid-cols-base': base,
    '--grid-cols-sm': sm,
    '--grid-cols-md': md,
    '--grid-cols-lg': lg,
    '--grid-gap': space(gap),
    '--grid-row-gap': space(rowGap),
    '--grid-align': align,
    '--grid-min-item': minItemWidth && (minItemWidth in MIN_WIDTH ? MIN_WIDTH[minItemWidth as keyof typeof MIN_WIDTH] : minItemWidth),
  };
  const mode = minItemWidth ? s.autoFill : responsive ? s.responsive : s.fixed;
  return (
    <div ref={ref} className={cx(s.container, className)} style={style} {...rest}>
      <div role={role} className={cx(s.grid, mode)} style={vars}>
        {children}
      </div>
    </div>
  );
});
