import type { ReactNode } from 'react';
import type { SelectOption } from '../Select/Select';

/** Raw value a column exposes for sorting, searching and filtering. */
export type CellValue = string | number | boolean | Date | null | undefined;

export type SortDirection = 'asc' | 'desc';
export type SortState = { id: string; direction: SortDirection } | null;

export type CellAlign = 'start' | 'center' | 'end';
export type TableDensity = 'compact' | 'comfortable';
export type DataTableView = 'table' | 'list' | 'grid';

export type ColumnFilterConfig =
  | { type: 'text'; placeholder?: string }
  | { type: 'select'; options: Array<string | SelectOption> };

/** Active filter values keyed by column id. An empty string means "no filter". */
export type FilterValues = Record<string, string>;

export type DataTableColumn<T> = {
  id: string;
  /** Header text. Also used for the column menu, filter chip and grid/list fallbacks. */
  header: string;
  /** Raw value used to sort, search and filter. */
  accessor: (row: T) => CellValue;
  /** Custom cell content. Defaults to the formatted accessor value. */
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: CellAlign;
  /** Token-based width, e.g. `var(--size-field-lg)`, a percentage or `calc()` on tokens. */
  width?: string;
  /** Can be toggled off from the column visibility menu. Defaults to true. */
  hideable?: boolean;
  /** Adds a filter chip to the toolbar. `'text'` is shorthand for `{ type: 'text' }`. */
  filter?: 'text' | ColumnFilterConfig;
};

/** Accepts either a Set or an array of row ids. */
export type SelectionInput = ReadonlySet<string> | readonly string[];
