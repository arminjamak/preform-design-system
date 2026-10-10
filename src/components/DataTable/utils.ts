import { useCallback, useState } from 'react';
import type { CellValue, ColumnFilterConfig, DataTableColumn, FilterValues, SortState } from './types';

/** Controlled value with an uncontrolled fallback. */
export function useControllable<V>(controlled: V | undefined, fallback: V, onChange?: (next: V) => void): [V, (next: V) => void] {
  const [inner, setInner] = useState<V>(fallback);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : inner;
  const set = useCallback(
    (next: V) => {
      if (!isControlled) setInner(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [value, set];
}

export function normalizeFilter(filter: DataTableColumn<unknown>['filter']): ColumnFilterConfig | undefined {
  if (!filter) return undefined;
  return filter === 'text' ? { type: 'text' } : filter;
}

/** Plain-text form of a cell value, used for search, filters and fallback rendering. */
export function formatValue(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function compareValues(a: CellValue, b: CellValue): number {
  const emptyA = a === null || a === undefined || a === '';
  const emptyB = b === null || b === undefined || b === '';
  if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return collator.compare(formatValue(a), formatValue(b));
}

export function sortRows<T>(rows: readonly T[], columns: readonly DataTableColumn<T>[], sort: SortState): T[] {
  const col = sort && columns.find((c) => c.id === sort.id);
  if (!sort || !col) return [...rows];
  const dir = sort.direction === 'asc' ? 1 : -1;
  // Stable sort: keep original order for ties.
  return rows
    .map((row, index) => ({ row, index }))
    .sort((x, y) => compareValues(col.accessor(x.row), col.accessor(y.row)) * dir || x.index - y.index)
    .map((x) => x.row);
}

export function filterRows<T>(rows: readonly T[], columns: readonly DataTableColumn<T>[], filters: FilterValues, search: string): T[] {
  const active = columns
    .map((c) => ({ col: c, config: normalizeFilter(c.filter as DataTableColumn<unknown>['filter']), value: filters[c.id] ?? '' }))
    .filter((f) => f.config && f.value !== '');
  const query = search.trim().toLowerCase();
  if (!active.length && !query) return [...rows];
  return rows.filter((row) => {
    for (const f of active) {
      const text = formatValue(f.col.accessor(row));
      if (f.config!.type === 'select' ? text !== f.value : !text.toLowerCase().includes(f.value.toLowerCase())) return false;
    }
    if (!query) return true;
    return columns.some((c) => formatValue(c.accessor(row)).toLowerCase().includes(query));
  });
}

/** Next state when a sortable header is activated: ascending → descending → unsorted. */
export function nextSort(current: SortState, id: string): SortState {
  if (!current || current.id !== id) return { id, direction: 'asc' };
  return current.direction === 'asc' ? { id, direction: 'desc' } : null;
}
