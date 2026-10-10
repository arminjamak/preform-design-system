import type { HTMLAttributes } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import s from './DataTable.module.css';

export type TablePaginationProps = Omit<HTMLAttributes<HTMLElement>, 'onChange'> & {
  /** 1-based page number. */
  page: number;
  pageSize: number;
  /** Total number of rows across all pages. */
  total: number;
  onPageChange: (page: number) => void;
  /** Noun for the range text, e.g. "jobs". */
  itemLabel?: string;
};

/** Minimal pager: "1–20 of 134 jobs" with previous / next buttons. */
export function TablePagination({ page, pageSize, total, onPageChange, itemLabel, className, ...rest }: TablePaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);
  return (
    <nav aria-label="Pagination" className={cx(s.pagination, className)} {...rest}>
      <span className={s.paginationRange} aria-live="polite">
        {total === 0 ? `0 ${itemLabel ?? 'results'}` : `${from}–${to} of ${total}${itemLabel ? ` ${itemLabel}` : ''}`}
      </span>
      <span className={s.paginationButtons}>
        <IconButton label="Previous page" icon={<ChevronLeftIcon strokeWidth={2.4} />} size="sm" disabled={current <= 1} onClick={() => onPageChange(current - 1)} />
        <IconButton label="Next page" icon={<ChevronRightIcon strokeWidth={2.4} />} size="sm" disabled={current >= pages} onClick={() => onPageChange(current + 1)} />
      </span>
    </nav>
  );
}
