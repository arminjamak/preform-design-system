import { forwardRef, useId, type HTMLAttributes } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { IconButton } from '../IconButton/IconButton';
import { Select } from '../Select/Select';
import s from './Pagination.module.css';

export type PaginationProps = Omit<HTMLAttributes<HTMLElement>, 'onChange'> &
  WithForcedState & {
    /** Current page, 1-based. */
    page: number;
    pageCount: number;
    onChange: (page: number) => void;
    /** Pages shown on each side of the current page before collapsing into an ellipsis. */
    siblingCount?: number;
    /** Items per page; with `total` it drives the "1–20 of 134" summary. */
    pageSize?: number;
    /** Shows the page-size select when given together with `onPageSizeChange`. */
    pageSizeOptions?: number[];
    onPageSizeChange?: (pageSize: number) => void;
    /** Total item count for the summary. */
    total?: number;
    size?: 'sm' | 'md';
    /** "3 / 12" with prev/next only, for narrow panels. */
    compact?: boolean;
    disabled?: boolean;
    /** Accessible name of the landmark. */
    label?: string;
  };

type Token = number | 'start-ellipsis' | 'end-ellipsis';

/** Page list with first/last pages always visible and ellipses around the sibling window. */
export function getPageRange(page: number, pageCount: number, siblingCount = 1): Token[] {
  const count = Math.max(1, pageCount);
  const seq = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
  // first + last + current + two ellipses + siblings on each side
  if (count <= siblingCount * 2 + 5) return seq(1, count);
  const current = Math.min(Math.max(page, 1), count);
  const left = Math.max(current - siblingCount, 1);
  const right = Math.min(current + siblingCount, count);
  const showLeft = left > 3;
  const showRight = right < count - 2;
  const edge = 3 + siblingCount * 2;
  if (!showLeft) return [...seq(1, edge), 'end-ellipsis', count];
  if (!showRight) return [1, 'start-ellipsis', ...seq(count - edge + 1, count)];
  return [1, 'start-ellipsis', ...seq(left, right), 'end-ellipsis', count];
}

const fmt = (n: number) => n.toLocaleString();

/** Pages through job history, material libraries and print queues. Prev/next are IconButtons; the current page is accent-soft. */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    page,
    pageCount,
    onChange,
    siblingCount = 1,
    pageSize,
    pageSizeOptions,
    onPageSizeChange,
    total,
    size = 'sm',
    compact = false,
    disabled = false,
    label = 'Pagination',
    className,
    'data-state': state,
    ...rest
  },
  ref,
) {
  const sizeId = useId();
  const count = Math.max(1, pageCount);
  const current = Math.min(Math.max(page, 1), count);
  const go = (p: number) => {
    const next = Math.min(Math.max(p, 1), count);
    if (next !== current) onChange(next);
  };
  const ibSize = size === 'sm' ? 'sm' : 'md';

  const prev = (
    <IconButton
      label="Previous page"
      icon={<ChevronLeftIcon strokeWidth={2.4} />}
      size={ibSize}
      disabled={disabled || current <= 1}
      onClick={() => go(current - 1)}
      data-state={state}
    />
  );
  const next = (
    <IconButton
      label="Next page"
      icon={<ChevronRightIcon strokeWidth={2.4} />}
      size={ibSize}
      disabled={disabled || current >= count}
      onClick={() => go(current + 1)}
      data-state={state}
    />
  );

  const showSummary = total !== undefined && pageSize !== undefined;
  const start = total ? (current - 1) * (pageSize ?? 0) + 1 : 0;
  const end = total ? Math.min(current * (pageSize ?? 0), total) : 0;
  const showSizeSelect = !compact && pageSize !== undefined && !!pageSizeOptions?.length && !!onPageSizeChange;

  return (
    <nav ref={ref} aria-label={label} className={cx(s.root, s[size], disabled && s.disabled, className)} {...rest}>
      {showSummary && (
        <span className={s.summary} aria-live="polite">
          {fmt(start)}–{fmt(end)} of {fmt(total ?? 0)}
        </span>
      )}
      {compact ? (
        <span className={cx(s.group, showSummary && s.end)}>
          {prev}
          <span className={s.compactLabel} aria-hidden="true">
            <strong>{current}</strong> / {count}
          </span>
          <span className={s.srOnly} aria-live="polite">
            Page {current} of {count}
          </span>
          {next}
        </span>
      ) : (
        <span className={cx(s.group, showSummary && s.end)}>
          {prev}
          <ul className={s.pages}>
            {getPageRange(current, count, siblingCount).map((t) =>
              typeof t === 'number' ? (
                <li key={t}>
                  <button
                    type="button"
                    className={s.page}
                    aria-label={`Page ${t}`}
                    aria-current={t === current ? 'page' : undefined}
                    disabled={disabled}
                    onClick={() => go(t)}
                    data-state={state}
                  >
                    {t}
                  </button>
                </li>
              ) : (
                <li key={t} aria-hidden="true">
                  <span className={s.ellipsis}>…</span>
                </li>
              ),
            )}
          </ul>
          {next}
        </span>
      )}
      {showSizeSelect && (
        <span className={s.sizeField}>
          <label htmlFor={sizeId}>Per page</label>
          <Select
            id={sizeId}
            label="Per page"
            size={size}
            className={s.sizeSelect}
            value={String(pageSize)}
            options={pageSizeOptions!.map(String)}
            disabled={disabled}
            onChange={(v) => onPageSizeChange!(Number(v))}
          />
        </span>
      )}
    </nav>
  );
});
