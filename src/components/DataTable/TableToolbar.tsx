import type { HTMLAttributes, ReactNode } from 'react';
import { LayoutGridIcon, ListIcon, SearchIcon, Table2Icon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { TextField } from '../TextField/TextField';
import type { DataTableView } from './types';
import s from './DataTable.module.css';

const VIEW_META: Record<DataTableView, { label: string; icon: ReactNode }> = {
  table: { label: 'Table view', icon: <Table2Icon strokeWidth={2.2} /> },
  list: { label: 'List view', icon: <ListIcon strokeWidth={2.2} /> },
  grid: { label: 'Grid view', icon: <LayoutGridIcon strokeWidth={2.2} /> },
};

export type ViewToggleProps = {
  value: DataTableView;
  onChange: (view: DataTableView) => void;
  /** Views offered, in order. */
  views?: DataTableView[];
  label?: string;
  className?: string;
};

/** Table / List / Grid view switch: icon buttons with `aria-pressed`. */
export function ViewToggle({ value, onChange, views = ['table', 'list', 'grid'], label = 'View', className }: ViewToggleProps) {
  return (
    <div role="group" aria-label={label} className={cx(s.viewToggle, className)}>
      {views.map((v) => (
        <IconButton key={v} label={VIEW_META[v].label} icon={VIEW_META[v].icon} size="sm" pressed={v === value} onClick={() => onChange(v)} />
      ))}
    </div>
  );
}

export type TableToolbarProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Search query. The search box is shown when `onSearchChange` is set. */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchLabel?: string;
  searchPlaceholder?: string;
  /** Filter chips, usually `TableFilter`s. */
  filters?: ReactNode;
  /** Usually a `ColumnVisibilityMenu`. */
  columnsMenu?: ReactNode;
  /** When greater than zero the search and filters are replaced by the selection bar. */
  selectedCount?: number;
  /** Bulk-action buttons shown next to the selected count. */
  bulkActions?: ReactNode;
  onClearSelection?: () => void;
  /** View toggle is shown when `onViewChange` is set and more than one view is offered. */
  view?: DataTableView;
  onViewChange?: (view: DataTableView) => void;
  views?: DataTableView[];
  /** Extra controls placed before the columns button. */
  end?: ReactNode;
};

/** Bar above a data table: search + filter chips, or "3 selected" + bulk actions, then columns and view controls. */
export function TableToolbar({
  search = '',
  onSearchChange,
  searchLabel = 'Search',
  searchPlaceholder = 'Search…',
  filters,
  columnsMenu,
  selectedCount = 0,
  bulkActions,
  onClearSelection,
  view = 'table',
  onViewChange,
  views = ['table', 'list', 'grid'],
  end,
  className,
  ...rest
}: TableToolbarProps) {
  const selecting = selectedCount > 0;
  return (
    <div className={cx(s.toolbar, className)} {...rest}>
      <div className={s.toolbarStart}>
        {selecting ? (
          <div className={s.selectionBar}>
            <span className={s.selectionCount} aria-live="polite">{`${selectedCount} selected`}</span>
            {bulkActions}
            {onClearSelection && (
              <Button variant="ghost" size="sm" onClick={onClearSelection}>
                Clear
              </Button>
            )}
          </div>
        ) : (
          <>
            {onSearchChange && (
              <TextField
                label={searchLabel}
                placeholder={searchPlaceholder}
                value={search}
                onChange={onSearchChange}
                className={s.search}
                iconStart={<SearchIcon strokeWidth={2.4} />}
                iconEnd={
                  search ? (
                    <IconButton label="Clear search" icon={<XIcon strokeWidth={2.4} />} size="xs" className={s.searchClear} onClick={() => onSearchChange('')} />
                  ) : undefined
                }
                onKeyDown={(e) => e.key === 'Escape' && search && (e.stopPropagation(), onSearchChange(''))}
              />
            )}
            {filters && <div className={s.filters}>{filters}</div>}
          </>
        )}
      </div>
      <div className={s.toolbarEnd}>
        {end}
        {columnsMenu}
        {onViewChange && views.length > 1 && <ViewToggle value={view} onChange={onViewChange} views={views} />}
      </div>
    </div>
  );
}
