import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import s from './Skeleton.module.css';

/** A length is either a token name (`space-8`, `size-control-sm`, `size-field-lg`, `font-size-md`…) or a percentage (`'60%'`). */
export type SkeletonLength = `${number}%` | `space-${string}` | `size-${string}` | `font-size-${string}`;
export type SkeletonRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type SkeletonProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /** `text`: stacked lines with varied widths. `rect`: a block. `circle`: an avatar/thumbnail dot (uses `width` for both sides). */
  variant?: 'text' | 'rect' | 'circle';
  width?: SkeletonLength;
  /** Block height, or the bar height of each text line. */
  height?: SkeletonLength;
  /** Number of text lines (variant `text`). The last line is shorter, like a paragraph end. */
  lines?: number;
  radius?: SkeletonRadius;
};

/** Resolves a token name or percentage to a CSS value. */
export const skeletonLength = (v?: SkeletonLength) => (v == null ? undefined : v.endsWith('%') ? v : `var(--${v})`);

/** Widths cycle so stacked lines look like real text, not a barcode. */
const LINE_WIDTHS = [100, 94, 97, 88, 92];

/** Shimmering placeholder shown while models, jobs or printer data load. Hidden from assistive tech; wrap groups in a status region (the presets do). */
export function Skeleton({ variant = 'rect', width, height, lines = 3, radius, className, style, ...rest }: SkeletonProps) {
  const w = skeletonLength(width);
  const h = skeletonLength(height);
  const borderRadius = radius ? `var(--radius-${radius})` : undefined;

  if (variant === 'text') {
    const n = Math.max(1, Math.floor(lines));
    return (
      <span aria-hidden="true" className={cx(s.lines, className)} style={{ width: w, ...style }} {...rest}>
        {Array.from({ length: n }, (_, i) => {
          const lw = n > 1 && i === n - 1 ? 60 : LINE_WIDTHS[i % LINE_WIDTHS.length];
          return <span key={i} className={cx(s.skeleton, s.line)} style={{ width: `${lw}%`, height: h, borderRadius }} />;
        })}
      </span>
    );
  }
  const box: CSSProperties = variant === 'circle' ? { width: w, height: w, borderRadius } : { width: w, height: h, borderRadius };
  return <span aria-hidden="true" className={cx(s.skeleton, variant === 'circle' && s.circle, className)} style={{ ...box, ...style }} {...rest} />;
}

type PresetProps = {
  /** Announced to screen readers while loading. */
  label?: string;
  className?: string;
};

function Status({ label }: { label: string }) {
  return <span className={s.srOnly}>{label}</span>;
}

export type SkeletonCardProps = PresetProps & {
  /** Show the thumbnail block at the top (model preview). */
  media?: boolean;
  lines?: number;
};

/** Placeholder for a job / model card: thumbnail, title, details and a footer action. */
export function SkeletonCard({ label = 'Loading', media = true, lines = 2, className }: SkeletonCardProps) {
  return (
    <div role="status" aria-busy="true" className={cx(s.group, s.card, className)}>
      <Status label={label} />
      {media && <Skeleton height="space-24" radius="md" />}
      <div className={s.cardBody}>
        <Skeleton height="space-3" width="55%" />
        <Skeleton variant="text" lines={lines} />
      </div>
      <div className={s.cardFooter}>
        <Skeleton height="size-control-xs" width="30%" radius="full" />
        <Skeleton height="size-control-sm" width="25%" radius="full" />
      </div>
    </div>
  );
}

export type SkeletonListItemProps = PresetProps & {
  /** Leading avatar / thumbnail circle. */
  avatar?: boolean;
  /** Secondary line under the title. */
  secondary?: boolean;
  /** Trailing meta block (e.g. a time or status pill). */
  trailing?: boolean;
};

/** Placeholder for a list row: printer list, job queue, material list. */
export function SkeletonListItem({ label = 'Loading', avatar = true, secondary = true, trailing = true, className }: SkeletonListItemProps) {
  return (
    <div role="status" aria-busy="true" className={cx(s.group, s.listItem, className)}>
      <Status label={label} />
      {avatar && <Skeleton variant="circle" width="size-control-sm" />}
      <span className={s.listText}>
        <Skeleton height="space-3" width="60%" />
        {secondary && <Skeleton height="space-2" width="40%" />}
      </span>
      {trailing && <Skeleton height="space-4" width="size-control-xl" radius="full" />}
    </div>
  );
}

export type SkeletonTableRowProps = PresetProps & {
  columns?: number;
  /** `div` renders a grid row for div-based tables; `tr` renders a real table row of `<td>` cells. */
  as?: 'div' | 'tr';
};

const COL_WIDTHS: SkeletonLength[] = ['80%', '55%', '65%', '40%', '70%', '50%'];

/** Placeholder for a data table row (print history, fleet table). */
export function SkeletonTableRow({ label = 'Loading', columns = 4, as = 'div', className }: SkeletonTableRowProps) {
  const cols = Array.from({ length: Math.max(1, columns) }, (_, i) => COL_WIDTHS[i % COL_WIDTHS.length]);
  if (as === 'tr') {
    return (
      <tr aria-busy="true" className={cx(s.tr, className)}>
        {cols.map((w, i) => (
          <td key={i}>
            {i === 0 && <Status label={label} />}
            <Skeleton height="space-3" width={w} />
          </td>
        ))}
      </tr>
    );
  }
  return (
    <div role="status" aria-busy="true" className={cx(s.group, s.row, className)} style={{ '--sk-cols': `repeat(${cols.length}, minmax(0, 1fr))` } as CSSProperties}>
      <Status label={label} />
      {cols.map((w, i) => (
        <Skeleton key={i} height="space-3" width={w} />
      ))}
    </div>
  );
}
