import type { ReactNode, ThHTMLAttributes } from 'react';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import type { CellAlign, SortDirection } from './types';
import s from './DataTable.module.css';

export type SortableHeaderProps = Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align' | 'children'> &
  WithForcedState & {
    children: ReactNode;
    /** Current direction for this column, or null when the table is sorted by another column. */
    direction?: SortDirection | null;
    /** Called when the header is activated. Omit (or set `sortable={false}`) for a plain header. */
    onSort?: () => void;
    sortable?: boolean;
    align?: CellAlign;
  };

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

/** Column header cell. When sortable it renders a button with a direction arrow and sets `aria-sort` on the `<th>`. */
export function SortableHeader({ children, direction = null, onSort, sortable = !!onSort, align = 'start', className, 'data-state': state, ...rest }: SortableHeaderProps) {
  const alignClass = align === 'end' ? s.alignEnd : align === 'center' ? s.alignCenter : undefined;
  if (!sortable) {
    return (
      <th scope="col" className={cx(s.th, alignClass, className)} {...rest}>
        <span className={s.thLabel}>{children}</span>
      </th>
    );
  }
  const Icon = direction === 'asc' ? ArrowUpIcon : direction === 'desc' ? ArrowDownIcon : ArrowUpDownIcon;
  return (
    <th scope="col" aria-sort={direction ? ARIA_SORT[direction] : 'none'} className={cx(s.th, alignClass, className)} {...rest}>
      <button type="button" className={cx(s.sortButton, direction && s.sorted)} onClick={onSort} data-state={state}>
        <span className={s.thLabel}>{children}</span>
        <Icon className={s.sortIcon} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </th>
  );
}
