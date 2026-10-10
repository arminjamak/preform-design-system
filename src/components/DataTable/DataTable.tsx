import { useMemo, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowDownIcon, ArrowUpIcon, InboxIcon, SearchXIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { Checkbox } from '../Checkbox/Checkbox';
import { IconButton } from '../IconButton/IconButton';
import type { MenuItem } from '../Menu/Menu';
import { Select } from '../Select/Select';
import { Spinner } from '../Spinner/Spinner';
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu';
import { RowActionsMenu } from './RowActionsMenu';
import { SortableHeader } from './SortableHeader';
import { TableFilter } from './TableFilter';
import { TablePagination } from './TablePagination';
import { TableToolbar } from './TableToolbar';
import type { DataTableColumn, DataTableView, FilterValues, SelectionInput, SortState, TableDensity } from './types';
import { filterRows, formatValue, nextSort, sortRows, useControllable } from './utils';
import s from './DataTable.module.css';

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: readonly T[];
  getRowId: (row: T) => string;
  /** Accessible name of the table / list / grid, e.g. "Print queue". */
  label: string;
  /** Human name of a row for checkbox and action labels. Defaults to the first column's value. */
  getRowLabel?: (row: T) => string;

  /** Controlled sort. Pass `null` for unsorted. Leave undefined to let the table manage it. */
  sort?: SortState;
  defaultSort?: SortState;
  onSortChange?: (sort: SortState) => void;

  /** Adds a checkbox column with a select-all header. Implied when `selection` is set. */
  selectable?: boolean;
  /** Selected row ids (Set or array). Leave undefined for uncontrolled selection. */
  selection?: SelectionInput;
  onSelectionChange?: (ids: string[], set: Set<string>) => void;

  /** Items for the ⋮ menu in the last column (and on list items / cards). */
  rowActions?: (row: T) => MenuItem[];
  onRowClick?: (row: T) => void;

  density?: TableDensity;
  /** Header sticks to the top of the scroll area; pair with `maxHeight`. */
  stickyHeader?: boolean;
  striped?: boolean;
  /** Token-based max height of the scroll area, e.g. `calc(var(--space-24) * 4)`. */
  maxHeight?: string;
  /** Shows skeleton rows / cards instead of data. */
  loading?: boolean;
  loadingRows?: number;
  /** Shown when `rows` is empty. Filtered-to-nothing shows a built-in "No matches" state instead. */
  emptyState?: ReactNode;

  view?: DataTableView;
  defaultView?: DataTableView;
  onViewChange?: (view: DataTableView) => void;
  /** Views offered by the toolbar toggle. */
  views?: DataTableView[];
  /** Grid view tile content. Defaults to the first column as a title plus the other visible columns. */
  renderCard?: (row: T) => ReactNode;
  /** List view row content. Defaults to the first column plus a summary line of the other visible columns. */
  renderListItem?: (row: T) => ReactNode;

  hiddenColumns?: string[];
  defaultHiddenColumns?: string[];
  onHiddenColumnsChange?: (hidden: string[]) => void;
  filters?: FilterValues;
  onFiltersChange?: (filters: FilterValues) => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  /** Rows are already sorted, filtered and paged by the caller (server-side data). */
  manual?: boolean;
  /** Total row count for pagination when `manual` is set. */
  totalRows?: number;

  /** Renders the built-in `TableToolbar` (search, filter chips, columns menu, bulk actions, view toggle). */
  toolbar?: boolean;
  searchPlaceholder?: string;
  /** Bulk-action buttons for the selection bar; receives the selected ids. */
  bulkActions?: (selectedIds: string[]) => ReactNode;
  /** Extra toolbar controls placed before the columns button. */
  toolbarEnd?: ReactNode;

  /** Enables the footer pager. */
  pageSize?: number;
  /** Controlled 1-based page. */
  page?: number;
  onPageChange?: (page: number) => void;
  /** Noun used in the pager range text, e.g. "jobs". */
  itemLabel?: string;

  className?: string;
};

const EMPTY: string[] = [];

/** Sortable, selectable, filterable data table with list and grid views. Used for the PreForm print queue and job history. */
export function DataTable<T>(props: DataTableProps<T>) {
  const {
    columns,
    rows,
    getRowId,
    label,
    getRowLabel,
    selectable: selectableProp,
    rowActions,
    onRowClick,
    density = 'compact',
    stickyHeader,
    striped,
    maxHeight,
    loading,
    loadingRows = 6,
    emptyState,
    views = ['table', 'list', 'grid'],
    renderCard,
    renderListItem,
    manual,
    totalRows,
    toolbar,
    searchPlaceholder,
    bulkActions,
    toolbarEnd,
    pageSize,
    itemLabel,
    className,
  } = props;

  const [sort, setSort] = useControllable<SortState>(props.sort, props.defaultSort ?? null, props.onSortChange);
  const [view, setView] = useControllable<DataTableView>(props.view, props.defaultView ?? 'table', props.onViewChange);
  const [hidden, setHidden] = useControllable<string[]>(props.hiddenColumns, props.defaultHiddenColumns ?? EMPTY, props.onHiddenColumnsChange);
  const [filters, setFiltersRaw] = useControllable<FilterValues>(props.filters, {}, props.onFiltersChange);
  const [search, setSearchRaw] = useControllable<string>(props.search, '', props.onSearchChange);
  const [page, setPage] = useControllable<number>(props.page, 1, props.onPageChange);
  const [selectionValue, setSelectionValue] = useControllable<SelectionInput>(props.selection, EMPTY, (next) => {
    const ids = Array.from(next);
    props.onSelectionChange?.(ids, new Set(ids));
  });

  const selectable = selectableProp ?? props.selection !== undefined;
  const selected = useMemo(() => new Set(selectionValue), [selectionValue]);
  const setSelected = (next: Set<string>) => setSelectionValue(Array.from(next));

  const setFilters = (next: FilterValues) => {
    setFiltersRaw(next);
    if (page !== 1) setPage(1);
  };
  const setSearch = (next: string) => {
    setSearchRaw(next);
    if (page !== 1) setPage(1);
  };

  const visibleColumns = columns.filter((c) => c.hideable === false || !hidden.includes(c.id));
  const hasQuery = search.trim() !== '' || Object.values(filters).some((v) => v !== '');

  const processed = useMemo(
    () => (manual ? [...rows] : sortRows(filterRows(rows, columns, filters, search), columns, sort)),
    [manual, rows, columns, filters, search, sort],
  );
  const total = manual ? totalRows ?? rows.length : processed.length;
  const pageCount = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const displayed = pageSize && !manual ? processed.slice((currentPage - 1) * pageSize, currentPage * pageSize) : processed;

  const rowLabel = (row: T) => getRowLabel?.(row) ?? ((columns[0] ? formatValue(columns[0].accessor(row)) : '') || getRowId(row));

  // Select-all acts on the rows currently shown.
  const shownIds = displayed.map(getRowId);
  const shownSelected = shownIds.filter((id) => selected.has(id)).length;
  const allShownSelected = shownIds.length > 0 && shownSelected === shownIds.length;
  const toggleAll = () => {
    const next = new Set(selected);
    shownIds.forEach((id) => (allShownSelected ? next.delete(id) : next.add(id)));
    setSelected(next);
  };
  const toggleOne = (id: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(id);
    else next.delete(id);
    setSelected(next);
  };

  const rowInteraction = (row: T) =>
    onRowClick
      ? {
          tabIndex: 0,
          onClick: () => onRowClick(row),
          onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
            if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
            e.preventDefault();
            onRowClick(row);
          },
        }
      : {};

  const stop = { onClick: (e: { stopPropagation: () => void }) => e.stopPropagation() };

  const renderValue = (c: DataTableColumn<T>, row: T) => (c.cell ? c.cell(row) : formatValue(c.accessor(row)));

  const selectBox = (row: T, id: string) => (
    <Checkbox label={`Select ${rowLabel(row)}`} checked={selected.has(id)} onChange={(on) => toggleOne(id, on)} />
  );
  const actionsMenu = (row: T, variant: 'ghost' | 'floating' = 'ghost') =>
    rowActions ? <RowActionsMenu label={`Actions for ${rowLabel(row)}`} items={rowActions(row)} buttonVariant={variant} /> : null;

  /* ---------- empty / loading ---------- */

  const clearQuery = () => {
    setSearchRaw('');
    setFiltersRaw({});
    setPage(1);
  };
  const noMatches = rows.length > 0 || (manual && hasQuery);
  const emptyContent =
    noMatches && hasQuery ? (
      <div className={s.empty}>
        <SearchXIcon className={s.emptyIcon} strokeWidth={1.8} aria-hidden="true" />
        <p className={s.emptyTitle}>No matches</p>
        <p className={s.emptyText}>Nothing matches the current search and filters.</p>
        <Button size="sm" variant="outline" onClick={clearQuery}>
          Clear search and filters
        </Button>
      </div>
    ) : (
      emptyState ?? (
        <div className={s.empty}>
          <InboxIcon className={s.emptyIcon} strokeWidth={1.8} aria-hidden="true" />
          <p className={s.emptyTitle}>Nothing here yet</p>
        </div>
      )
    );
  const isEmpty = !loading && displayed.length === 0;
  const skeletons = Array.from({ length: loadingRows }, (_, i) => i);

  /* ---------- views ---------- */

  const colCount = visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);
  const alignClass = (a?: string) => (a === 'end' ? s.alignEnd : a === 'center' ? s.alignCenter : undefined);

  const tableView = (
    <table className={s.table} aria-label={label} aria-busy={loading || undefined}>
      <colgroup>
        {selectable && <col className={s.colSelect} />}
        {visibleColumns.map((c) => (
          <col key={c.id} style={c.width ? ({ width: c.width } as CSSProperties) : undefined} />
        ))}
        {rowActions && <col className={s.colActions} />}
      </colgroup>
      <thead className={s.thead}>
        <tr>
          {selectable && (
            <th scope="col" className={cx(s.th, s.selectCell)}>
              <Checkbox
                label="Select all rows"
                checked={allShownSelected}
                indeterminate={shownSelected > 0 && !allShownSelected}
                disabled={loading || shownIds.length === 0}
                onChange={toggleAll}
              />
            </th>
          )}
          {visibleColumns.map((c) => (
            <SortableHeader
              key={c.id}
              align={c.align}
              sortable={!!c.sortable}
              direction={sort?.id === c.id ? sort.direction : null}
              onSort={c.sortable ? () => setSort(nextSort(sort, c.id)) : undefined}
            >
              {c.header}
            </SortableHeader>
          ))}
          {rowActions && (
            <th scope="col" className={cx(s.th, s.actionsCell)}>
              <span className={s.srOnly}>Actions</span>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          skeletons.map((i) => (
            <tr key={i} className={s.tr} aria-hidden="true">
              {selectable && <td className={cx(s.td, s.selectCell)}><span className={cx(s.skeleton, s.skeletonBox)} /></td>}
              {visibleColumns.map((c) => (
                <td key={c.id} className={cx(s.td, alignClass(c.align))}>
                  <span className={s.skeleton} />
                </td>
              ))}
              {rowActions && <td className={cx(s.td, s.actionsCell)} />}
            </tr>
          ))
        ) : isEmpty ? (
          <tr>
            <td colSpan={colCount} className={s.emptyCell}>
              {emptyContent}
            </td>
          </tr>
        ) : (
          displayed.map((row) => {
            const id = getRowId(row);
            const isSel = selected.has(id);
            return (
              <tr key={id} className={cx(s.tr, isSel && s.selected, onRowClick && s.clickable)} aria-selected={selectable ? isSel : undefined} {...rowInteraction(row)}>
                {selectable && (
                  <td className={cx(s.td, s.selectCell)} {...stop}>
                    {selectBox(row, id)}
                  </td>
                )}
                {visibleColumns.map((c, i) => {
                  const Cell = i === 0 ? 'th' : 'td';
                  return (
                    <Cell key={c.id} scope={i === 0 ? 'row' : undefined} className={cx(s.td, i === 0 && s.rowHeader, alignClass(c.align))}>
                      {renderValue(c, row)}
                    </Cell>
                  );
                })}
                {rowActions && (
                  <td className={cx(s.td, s.actionsCell)} {...stop}>
                    {actionsMenu(row)}
                  </td>
                )}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );

  const [primary, ...secondary] = visibleColumns;

  const listView = (
    <ul className={s.list} aria-label={label} aria-busy={loading || undefined}>
      {loading
        ? skeletons.map((i) => (
            <li key={i} className={s.listItem} aria-hidden="true">
              <span className={s.listBody}>
                <span className={s.skeleton} />
                <span className={cx(s.skeleton, s.skeletonShort)} />
              </span>
            </li>
          ))
        : isEmpty
          ? <li className={s.emptyItem}>{emptyContent}</li>
          : displayed.map((row) => {
              const id = getRowId(row);
              const isSel = selected.has(id);
              return (
                <li key={id} className={cx(s.listItem, isSel && s.selected, onRowClick && s.clickable)} {...rowInteraction(row)}>
                  {selectable && <span className={s.listSelect} {...stop}>{selectBox(row, id)}</span>}
                  <div className={s.listBody}>
                    {renderListItem ? (
                      renderListItem(row)
                    ) : (
                      <>
                        <span className={s.listTitle}>{primary && renderValue(primary, row)}</span>
                        <span className={s.listMeta}>
                          {secondary.map((c) => (
                            <span key={c.id} className={s.listMetaItem}>
                              {renderValue(c, row)}
                            </span>
                          ))}
                        </span>
                      </>
                    )}
                  </div>
                  {rowActions && <span className={s.listActions} {...stop}>{actionsMenu(row)}</span>}
                </li>
              );
            })}
    </ul>
  );

  const gridView = (
    <ul className={s.grid} aria-label={label} aria-busy={loading || undefined}>
      {loading
        ? skeletons.map((i) => (
            <li key={i} aria-hidden="true">
              <Card padding="none" className={s.card}>
                <span className={s.skeletonThumb} />
                <span className={s.cardDefault}>
                  <span className={s.skeleton} />
                  <span className={cx(s.skeleton, s.skeletonShort)} />
                </span>
              </Card>
            </li>
          ))
        : isEmpty
          ? <li className={s.emptyItem}>{emptyContent}</li>
          : displayed.map((row) => {
              const id = getRowId(row);
              const isSel = selected.has(id);
              return (
                <li key={id}>
                  <Card
                    padding="none"
                    selected={isSel}
                    interactive={!!onRowClick}
                    className={cx(s.card, selectable && s.cardSelectable, rowActions && s.cardHasActions)}
                    {...rowInteraction(row)}
                  >
                    {renderCard ? (
                      renderCard(row)
                    ) : (
                      <div className={s.cardDefault}>
                        <p className={s.cardTitle}>{primary && renderValue(primary, row)}</p>
                        <dl className={s.cardFields}>
                          {secondary.map((c) => (
                            <div key={c.id} className={s.cardField}>
                              <dt>{c.header}</dt>
                              <dd>{renderValue(c, row)}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                    {selectable && <span className={s.cardSelect} {...stop}>{selectBox(row, id)}</span>}
                    {rowActions && <span className={s.cardActions} {...stop}>{actionsMenu(row, 'floating')}</span>}
                  </Card>
                </li>
              );
            })}
    </ul>
  );

  /* ---------- toolbar ---------- */

  const filterable = columns.filter((c) => c.filter);
  const sortable = columns.filter((c) => c.sortable);
  const sortControl =
    view !== 'table' && sortable.length > 0 ? (
      <span className={s.sortControl}>
        <Select
          label="Sort by"
          size="sm"
          value={sort?.id ?? ''}
          options={[{ value: '', label: 'Sort: default' }, ...sortable.map((c) => ({ value: c.id, label: `Sort: ${c.header}` }))]}
          onChange={(id) => setSort(id ? { id, direction: sort?.direction ?? 'asc' } : null)}
          className={s.sortSelect}
        />
        <IconButton
          label={sort?.direction === 'desc' ? 'Sorted descending, switch to ascending' : 'Sorted ascending, switch to descending'}
          icon={sort?.direction === 'desc' ? <ArrowDownIcon strokeWidth={2.4} /> : <ArrowUpIcon strokeWidth={2.4} />}
          size="sm"
          variant="outline"
          disabled={!sort}
          onClick={() => sort && setSort({ id: sort.id, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
        />
      </span>
    ) : null;

  const selectedIds = Array.from(selected);

  return (
    <div className={cx(s.root, s[density], striped && s.striped, stickyHeader && s.stickyHeader, className)}>
      {toolbar && (
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchLabel={`Search ${label}`}
          searchPlaceholder={searchPlaceholder}
          filters={
            filterable.length > 0
              ? filterable.map((c) => (
                  <TableFilter
                    key={c.id}
                    label={c.header}
                    config={c.filter!}
                    value={filters[c.id] ?? ''}
                    onChange={(v) => setFilters({ ...filters, [c.id]: v })}
                  />
                ))
              : undefined
          }
          columnsMenu={!(view === 'grid' && renderCard) && !(view === 'list' && renderListItem) ? <ColumnVisibilityMenu columns={columns} hidden={hidden} onChange={setHidden} /> : undefined}
          selectedCount={selectable ? selected.size : 0}
          bulkActions={bulkActions?.(selectedIds)}
          onClearSelection={() => setSelected(new Set())}
          view={view}
          onViewChange={setView}
          views={views}
          end={
            <>
              {loading && <Spinner size="xs" tone="muted" label={`Loading ${label}`} />}
              {sortControl}
              {toolbarEnd}
            </>
          }
        />
      )}
      <div
        className={cx(s.scroll, view === 'grid' && s.scrollPanel)}
        style={maxHeight ? { maxHeight } : undefined}
        tabIndex={maxHeight ? 0 : undefined}
        role={maxHeight ? 'region' : undefined}
        aria-label={maxHeight ? `${label}, scrollable` : undefined}
      >
        {view === 'table' ? tableView : view === 'list' ? listView : gridView}
      </div>
      {pageSize !== undefined && !loading && total > 0 && (
        <TablePagination page={currentPage} pageSize={pageSize} total={total} onPageChange={setPage} itemLabel={itemLabel} className={s.footer} />
      )}
    </div>
  );
}
