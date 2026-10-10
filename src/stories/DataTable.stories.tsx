import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { ArrowUpToLineIcon, BoxIcon, CircleSlashIcon, ClockIcon, CopyIcon, ExternalLinkIcon, LayersIcon, PauseIcon, PrinterIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react';
import { DataTable, type DataTableProps } from '../components/DataTable/DataTable';
import { SortableHeader } from '../components/DataTable/SortableHeader';
import { TableToolbar } from '../components/DataTable/TableToolbar';
import { TableFilter } from '../components/DataTable/TableFilter';
import { ColumnVisibilityMenu } from '../components/DataTable/ColumnVisibilityMenu';
import { TablePagination } from '../components/DataTable/TablePagination';
import { RowActionsMenu } from '../components/DataTable/RowActionsMenu';
import type { DataTableColumn, FilterValues, SortState, DataTableView } from '../components/DataTable/types';
import { Badge } from '../components/Badge/Badge';
import { Button } from '../components/Button/Button';
import type { MenuItem } from '../components/Menu/Menu';
import type { Tone } from '../lib/types';

/* ---------------------------------------------------------------- data */

type JobStatus = 'Printing' | 'Queued' | 'Paused' | 'Completed' | 'Failed' | 'Canceled';

type PrintJob = {
  id: string;
  name: string;
  printer: string;
  material: string;
  layers: number;
  minutes: number;
  status: JobStatus;
  submittedBy: string;
  submitted: Date;
};

const job = (id: number, name: string, printer: string, material: string, layers: number, minutes: number, status: JobStatus, submittedBy: string, submitted: string): PrintJob => ({
  id: `job-${id}`,
  name,
  printer,
  material,
  layers,
  minutes,
  status,
  submittedBy,
  submitted: new Date(submitted),
});

const JOBS: PrintJob[] = [
  job(1042, 'Turbine housing v3', 'Form 4 · Tiny Tiger', 'Tough 2000 Resin', 1184, 254, 'Printing', 'Maya Chen', '2026-10-10T08:12:00'),
  job(1041, 'Dental arch – upper', 'Form 4B · Calm Koala', 'Precision Model Resin', 642, 71, 'Printing', 'Dr. Luis Ortega', '2026-10-10T07:55:00'),
  job(1040, 'Drone arm bracket ×12', 'Fuse 1+ 30W · Swift Heron', 'Nylon 12 Powder', 2210, 618, 'Printing', 'Sam Patel', '2026-10-10T06:40:00'),
  job(1039, 'Hinge clip test', 'Form 3+ · Quiet Falcon', 'Grey Resin V5', 312, 48, 'Queued', 'Maya Chen', '2026-10-10T09:03:00'),
  job(1038, 'Lens holder rev B', 'Form 4 · Tiny Tiger', 'Clear Resin V5', 506, 96, 'Queued', 'Jonas Weber', '2026-10-10T09:21:00'),
  job(1037, 'Gasket set – Shore 80A', 'Form 4 · Brave Otter', 'Flexible 80A Resin', 388, 132, 'Queued', 'Priya Nair', '2026-10-10T09:40:00'),
  job(1036, 'Chess set – knights', 'Form 3+ · Quiet Falcon', 'Black Resin V5', 1460, 305, 'Paused', 'Alex Kim', '2026-10-09T17:22:00'),
  job(1035, 'Intake manifold', 'Form 3L · Lucky Lynx', 'High Temp Resin', 2954, 812, 'Queued', 'Sam Patel', '2026-10-09T16:58:00'),
  job(1034, 'Surgical guide #18', 'Form 4B · Calm Koala', 'Surgical Guide Resin', 420, 54, 'Completed', 'Dr. Luis Ortega', '2026-10-09T15:11:00'),
  job(1033, 'Enclosure lid', 'Form 4 · Tiny Tiger', 'Durable Resin', 830, 168, 'Completed', 'Jonas Weber', '2026-10-09T13:46:00'),
  job(1032, 'Ring master – solitaire', 'Form 4B · Calm Koala', 'Castable Wax 40 Resin', 590, 112, 'Failed', 'Elena Rossi', '2026-10-09T11:30:00'),
  job(1031, 'Fixture plate', 'Form 3L · Lucky Lynx', 'Rigid 10K Resin', 1720, 395, 'Completed', 'Priya Nair', '2026-10-09T09:05:00'),
  job(1030, 'Cable strain relief ×40', 'Fuse 1+ 30W · Swift Heron', 'Nylon 12 Powder', 1980, 540, 'Completed', 'Sam Patel', '2026-10-08T18:44:00'),
  job(1029, 'Shoe sole lattice', 'Form 4 · Brave Otter', 'Elastic 50A Resin', 1350, 286, 'Canceled', 'Alex Kim', '2026-10-08T16:20:00'),
  job(1028, 'Light pipe array', 'Form 4 · Tiny Tiger', 'Clear Resin V5', 702, 121, 'Completed', 'Maya Chen', '2026-10-08T14:02:00'),
  job(1027, 'Splint – night guard', 'Form 4B · Calm Koala', 'Dental LT Clear Resin', 455, 63, 'Completed', 'Dr. Luis Ortega', '2026-10-08T10:37:00'),
  job(1026, 'Robot gripper fingers', 'Form 3+ · Quiet Falcon', 'Tough 1500 Resin', 980, 214, 'Failed', 'Jonas Weber', '2026-10-07T19:15:00'),
  job(1025, 'Architectural model – tower', 'Form 3L · Lucky Lynx', 'White Resin V5', 3420, 905, 'Completed', 'Elena Rossi', '2026-10-07T15:48:00'),
  job(1024, 'Pump impeller', 'Form 4 · Tiny Tiger', 'Tough 2000 Resin', 860, 177, 'Completed', 'Priya Nair', '2026-10-07T11:26:00'),
  job(1023, 'Earbud shell – left', 'Form 4B · Calm Koala', 'BioMed Clear Resin', 318, 44, 'Completed', 'Alex Kim', '2026-10-06T17:09:00'),
  job(1022, 'Earbud shell – right', 'Form 4B · Calm Koala', 'BioMed Clear Resin', 318, 44, 'Completed', 'Alex Kim', '2026-10-06T17:10:00'),
  job(1021, 'Jig for drill press', 'Form 3+ · Quiet Falcon', 'Grey Pro Resin', 1105, 236, 'Canceled', 'Sam Patel', '2026-10-06T09:52:00'),
  job(1020, 'Miniature – dragon', 'Form 4 · Brave Otter', 'Grey Resin V5', 1520, 198, 'Completed', 'Maya Chen', '2026-10-05T20:31:00'),
  job(1019, 'Vacuum nozzle adapter', 'Fuse 1+ 30W · Swift Heron', 'Nylon 11 Powder', 1640, 470, 'Completed', 'Jonas Weber', '2026-10-05T12:18:00'),
  job(1018, 'Calibration cube set', 'Form 4 · Tiny Tiger', 'Draft Resin', 260, 22, 'Completed', 'Priya Nair', '2026-10-04T08:00:00'),
];

const STATUS_TONE: Record<JobStatus, Tone> = {
  Printing: 'accent',
  Queued: 'neutral',
  Paused: 'warning',
  Completed: 'success',
  Failed: 'danger',
  Canceled: 'neutral',
};

const formatMinutes = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`);
const formatDate = (d: Date) => d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const unique = (key: keyof PrintJob) => Array.from(new Set(JOBS.map((j) => String(j[key])))).sort();

const StatusBadge = ({ status }: { status: JobStatus }) => (
  <Badge tone={STATUS_TONE[status]} variant={status === 'Canceled' ? 'outline' : 'soft'} size="md">
    {status}
  </Badge>
);

const columns: DataTableColumn<PrintJob>[] = [
  { id: 'name', header: 'Job', accessor: (r) => r.name, sortable: true, hideable: false, filter: 'text', width: 'var(--size-layout-sidebar)' },
  { id: 'printer', header: 'Printer', accessor: (r) => r.printer, sortable: true, filter: { type: 'select', options: unique('printer') } },
  { id: 'material', header: 'Material', accessor: (r) => r.material, sortable: true, filter: { type: 'select', options: unique('material') } },
  { id: 'layers', header: 'Layers', accessor: (r) => r.layers, cell: (r) => r.layers.toLocaleString('en-US'), sortable: true, align: 'end', width: 'var(--size-field-sm)' },
  { id: 'time', header: 'Est. time', accessor: (r) => r.minutes, cell: (r) => formatMinutes(r.minutes), sortable: true, align: 'end', width: 'var(--size-field-md)' },
  {
    id: 'status',
    header: 'Status',
    accessor: (r) => r.status,
    cell: (r) => <StatusBadge status={r.status} />,
    sortable: true,
    filter: { type: 'select', options: ['Printing', 'Queued', 'Paused', 'Completed', 'Failed', 'Canceled'] },
    width: 'var(--size-field-md)',
  },
  { id: 'submittedBy', header: 'Submitted by', accessor: (r) => r.submittedBy, sortable: true, filter: { type: 'select', options: unique('submittedBy') } },
  { id: 'submitted', header: 'Date', accessor: (r) => r.submitted, cell: (r) => formatDate(r.submitted), sortable: true, width: 'var(--size-field-lg)' },
];

const staticActions = (r: PrintJob): MenuItem[] => [
  { label: 'Open in PreForm', onSelect: fn(), icon: <ExternalLinkIcon strokeWidth={2.2} /> },
  { label: 'Move to top of queue', onSelect: fn(), icon: <ArrowUpToLineIcon strokeWidth={2.2} />, disabled: r.status !== 'Queued' },
  { label: 'Duplicate job', onSelect: fn(), icon: <CopyIcon strokeWidth={2.2} /> },
  { type: 'separator' },
  { label: 'Cancel print', onSelect: fn(), icon: <CircleSlashIcon strokeWidth={2.2} />, danger: true, disabled: !['Printing', 'Queued', 'Paused'].includes(r.status) },
];

/* ---------------------------------------------------------- renderers */

const Meta_ = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', minWidth: 0 }}>
    <span aria-hidden="true" style={{ display: 'inline-flex', width: 'var(--size-icon-xs)', height: 'var(--size-icon-xs)', color: 'var(--color-fg-faint)', flex: 'none' }}>
      {icon}
    </span>
    {children}
  </span>
);

const iconStyle = { width: '100%', height: '100%' };

const renderCard = (r: PrintJob) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div
      aria-hidden="true"
      style={{
        display: 'grid',
        placeItems: 'center',
        aspectRatio: '16 / 9',
        background: 'var(--color-bg-sunken)',
        color: 'var(--color-fg-faint)',
        borderBottom: 'var(--border-width-1) solid var(--color-border-subtle)',
      }}
    >
      <BoxIcon strokeWidth={1.4} style={{ width: 'var(--space-10)', height: 'var(--space-10)' }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <span className="pf-text-body-strong" style={{ color: 'var(--color-fg-default)', overflowWrap: 'anywhere' }}>
          {r.name}
        </span>
        <StatusBadge status={r.status} />
      </div>
      <div className="pf-text-body-sm" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', color: 'var(--color-fg-muted)' }}>
        <Meta_ icon={<PrinterIcon strokeWidth={2} style={iconStyle} />}>{r.printer}</Meta_>
        <Meta_ icon={<LayersIcon strokeWidth={2} style={iconStyle} />}>{`${r.material} · ${r.layers.toLocaleString('en-US')} layers`}</Meta_>
        <Meta_ icon={<ClockIcon strokeWidth={2} style={iconStyle} />}>{`${formatMinutes(r.minutes)} · ${r.submittedBy}`}</Meta_>
      </div>
    </div>
  </div>
);

const renderListItem = (r: PrintJob) => (
  <>
    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
      <span className="pf-text-body-strong" style={{ color: 'var(--color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {r.name}
      </span>
      <StatusBadge status={r.status} />
    </span>
    <span className="pf-text-body-sm" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1) var(--space-4)', color: 'var(--color-fg-muted)' }}>
      <Meta_ icon={<PrinterIcon strokeWidth={2} style={iconStyle} />}>{r.printer}</Meta_>
      <Meta_ icon={<LayersIcon strokeWidth={2} style={iconStyle} />}>{r.material}</Meta_>
      <Meta_ icon={<ClockIcon strokeWidth={2} style={iconStyle} />}>{formatMinutes(r.minutes)}</Meta_>
      <span>{`${r.submittedBy} · ${formatDate(r.submitted)}`}</span>
    </span>
  </>
);

/* --------------------------------------------------------------- meta */

/** Typed wrapper so Storybook infers `DataTableProps<PrintJob>` instead of `unknown` rows. */
function PrintQueueTable(props: DataTableProps<PrintJob>) {
  return <DataTable<PrintJob> {...props} />;
}

const Frame = ({ children }: { children: ReactNode }) => <div style={{ width: '100%' }}>{children}</div>;

const meta = {
  title: 'Components/Data Display/DataTable',
  component: PrintQueueTable,
  tags: ['expanded'],
  args: {
    label: 'Print queue',
    columns,
    rows: JOBS,
    getRowId: (r: PrintJob) => r.id,
    getRowLabel: (r: PrintJob) => r.name,
    density: 'compact',
    view: 'table',
    views: ['table', 'list', 'grid'],
    toolbar: true,
    selectable: true,
    rowActions: staticActions,
    stickyHeader: false,
    striped: false,
    loading: false,
    loadingRows: 6,
    pageSize: 10,
    itemLabel: 'jobs',
    searchPlaceholder: 'Search jobs…',
    maxHeight: undefined,
    manual: false,
    onRowClick: fn(),
    onSortChange: fn(),
    onSelectionChange: fn(),
    onViewChange: fn(),
    onFiltersChange: fn(),
    onHiddenColumnsChange: fn(),
    onSearchChange: fn(),
    onPageChange: fn(),
  },
  argTypes: {
    density: { control: 'inline-radio', options: ['compact', 'comfortable'] },
    view: { control: 'inline-radio', options: ['table', 'list', 'grid'] },
    views: { control: 'check', options: ['table', 'list', 'grid'] },
    maxHeight: {
      control: 'select',
      options: [undefined, 'calc(var(--space-24) * 3)', 'calc(var(--space-24) * 4)', 'var(--size-layout-panel)'],
    },
    pageSize: { control: { type: 'number', min: 5, max: 50, step: 5 } },
    loadingRows: { control: { type: 'number', min: 1, max: 12 } },
    sort: { control: 'object' },
    defaultSort: { control: 'object' },
    selection: { control: 'object' },
    hiddenColumns: { control: 'object' },
    filters: { control: 'object' },
    columns: { control: false },
    rows: { control: false },
    getRowId: { control: false },
    getRowLabel: { control: false },
    rowActions: { control: false },
    renderCard: { control: false },
    renderListItem: { control: false },
    bulkActions: { control: false },
    emptyState: { control: false },
    toolbarEnd: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Print queue and job history table. Sortable headers set `aria-sort`; selection uses the compact `Checkbox` with an indeterminate select-all; row actions open a portalled ⋮ menu; the same rows switch to List and Grid views. Row height and padding follow `--size-control-md|xl`, surfaces use `--color-bg-surface` / `--color-bg-subtle`, selection uses `--color-bg-accent-subtle`.',
      },
    },
  },
  decorators: [(Story) => <Frame><Story /></Frame>],
} satisfies Meta<typeof PrintQueueTable>;
export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------ stories */

/** Everything live: sorting, selection + bulk actions, filter chips, column visibility, view toggle and row actions that change the queue. */
export const Playground: Story = {
  render: function Render(args) {
    const [{ view }, updateArgs] = useArgs<{ view: DataTableView }>();
    const [rows, setRows] = useState(JOBS);
    const [sort, setSort] = useState<SortState>({ id: 'submitted', direction: 'desc' });
    const [selection, setSelection] = useState<string[]>([]);
    const [filters, setFilters] = useState<FilterValues>({});
    const [hidden, setHidden] = useState<string[]>(['submittedBy']);

    const setStatus = (ids: string[], status: JobStatus) => setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, status } : r)));
    const remove = (ids: string[]) => {
      setRows((rs) => rs.filter((r) => !ids.includes(r.id)));
      setSelection((sel) => sel.filter((id) => !ids.includes(id)));
    };

    const rowActions = (r: PrintJob): MenuItem[] => [
      { label: 'Open in PreForm', onSelect: fn(), icon: <ExternalLinkIcon strokeWidth={2.2} /> },
      {
        label: 'Move to top of queue',
        icon: <ArrowUpToLineIcon strokeWidth={2.2} />,
        disabled: r.status !== 'Queued',
        onSelect: () => setRows((rs) => [r, ...rs.filter((x) => x.id !== r.id)]),
      },
      r.status === 'Paused'
        ? { label: 'Resume print', icon: <RotateCcwIcon strokeWidth={2.2} />, onSelect: () => setStatus([r.id], 'Printing') }
        : { label: 'Pause print', icon: <PauseIcon strokeWidth={2.2} />, disabled: r.status !== 'Printing', onSelect: () => setStatus([r.id], 'Paused') },
      {
        label: 'Duplicate job',
        icon: <CopyIcon strokeWidth={2.2} />,
        onSelect: () => setRows((rs) => [{ ...r, id: `${r.id}-copy-${rs.length}`, name: `${r.name} (copy)`, status: 'Queued', submitted: new Date('2026-10-10T10:00:00') }, ...rs]),
      },
      { type: 'separator' },
      {
        label: 'Cancel print',
        icon: <CircleSlashIcon strokeWidth={2.2} />,
        danger: true,
        disabled: !['Printing', 'Queued', 'Paused'].includes(r.status),
        onSelect: () => setStatus([r.id], 'Canceled'),
      },
      { label: 'Remove from history', icon: <Trash2Icon strokeWidth={2.2} />, danger: true, onSelect: () => remove([r.id]) },
    ];

    return (
      <PrintQueueTable
        {...args}
        rows={rows}
        view={view}
        onViewChange={(v) => {
          updateArgs({ view: v });
          args.onViewChange?.(v);
        }}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          args.onSortChange?.(next);
        }}
        selection={selection}
        onSelectionChange={(ids, set) => {
          setSelection(ids);
          args.onSelectionChange?.(ids, set);
        }}
        filters={filters}
        onFiltersChange={(next) => {
          setFilters(next);
          args.onFiltersChange?.(next);
        }}
        hiddenColumns={hidden}
        onHiddenColumnsChange={(next) => {
          setHidden(next);
          args.onHiddenColumnsChange?.(next);
        }}
        rowActions={rowActions}
        renderCard={renderCard}
        renderListItem={renderListItem}
        bulkActions={(ids) => (
          <>
            <Button size="sm" variant="outline" iconStart={<PauseIcon strokeWidth={2.2} />} onClick={() => setStatus(ids, 'Paused')}>
              Pause
            </Button>
            <Button size="sm" variant="danger" iconStart={<CircleSlashIcon strokeWidth={2.2} />} onClick={() => setStatus(ids, 'Canceled')}>
              Cancel prints
            </Button>
          </>
        )}
      />
    );
  },
};

/** Default PreForm density (`--size-control-md` rows, body-sm text) with zebra striping. */
export const Compact: Story = {
  args: { density: 'compact', striped: true, toolbar: false, pageSize: undefined, defaultSort: { id: 'time', direction: 'desc' } },
};

/** Roomier `--size-control-xl` rows and body text for dashboards with fewer columns. */
export const Comfortable: Story = {
  args: { density: 'comfortable', pageSize: 8, defaultHiddenColumns: ['layers', 'submittedBy'] },
};

/** Selection controlled from outside with a plain `string[]`; the header checkbox shows the indeterminate state. */
export const Selection: Story = {
  render: function Render(args) {
    const [selection, setSelection] = useState<string[]>(['job-1039', 'job-1038', 'job-1037']);
    return (
      <PrintQueueTable
        {...args}
        rows={JOBS.filter((j) => j.status === 'Queued' || j.status === 'Printing' || j.status === 'Paused')}
        selection={selection}
        onSelectionChange={(ids) => setSelection(ids)}
        pageSize={undefined}
        bulkActions={() => (
          <Button size="sm" variant="primary" iconStart={<ArrowUpToLineIcon strokeWidth={2.2} />}>
            Move to top
          </Button>
        )}
      />
    );
  },
};

/** Skeleton rows while the queue loads from the printer fleet. */
export const Loading: Story = {
  args: { loading: true, pageSize: undefined },
};

/** No jobs in the queue; a custom empty state with a call to action. */
export const Empty: Story = {
  args: {
    rows: [],
    emptyState: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', textAlign: 'center' }}>
        <PrinterIcon aria-hidden="true" strokeWidth={1.6} style={{ width: 'var(--size-icon-lg)', height: 'var(--size-icon-lg)', color: 'var(--color-fg-faint)' }} />
        <p className="pf-text-body-strong" style={{ margin: 0, color: 'var(--color-fg-default)' }}>
          The print queue is empty
        </p>
        <p className="pf-text-body-sm" style={{ margin: 0, color: 'var(--color-fg-muted)' }}>
          Jobs you send from PreForm appear here with their printer, material and estimated time.
        </p>
        <Button size="sm" variant="primary">
          Upload a job
        </Button>
      </div>
    ),
  },
};

/** Grid view: the same rows as cards with a thumbnail. Checkbox and ⋮ float over the thumbnail. */
export const GridView: Story = {
  name: 'Grid view',
  args: { view: 'grid', renderCard, pageSize: 12 },
  render: function Render(args) {
    const [{ view }, updateArgs] = useArgs<{ view: DataTableView }>();
    return <PrintQueueTable {...args} view={view} onViewChange={(v) => updateArgs({ view: v })} />;
  },
};

/** List view: two-line rows with icon metadata, good for a narrow sidebar or history panel. */
export const ListView: Story = {
  name: 'List view',
  args: { view: 'list', renderListItem, pageSize: 8 },
  render: function Render(args) {
    const [{ view }, updateArgs] = useArgs<{ view: DataTableView }>();
    return <PrintQueueTable {...args} view={view} onViewChange={(v) => updateArgs({ view: v })} />;
  },
};

/** Header stays pinned while the body scrolls inside a fixed-height container (`maxHeight`). */
export const StickyHeader: Story = {
  name: 'Sticky header',
  args: { stickyHeader: true, maxHeight: 'calc(var(--space-24) * 3)', pageSize: undefined, toolbar: true },
};

/* ------------------------------------------------------------ pieces */

/** The exported building blocks on their own: toolbar with filter chips and columns menu, sortable headers, row actions and the pager. */
export const BuildingBlocks: Story = {
  name: 'Building blocks',
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Printing');
    const [material, setMaterial] = useState('');
    const [name, setName] = useState('');
    const [hidden, setHidden] = useState<string[]>(['submittedBy']);
    const [view, setView] = useState<DataTableView>('table');
    const [sort, setSort] = useState<SortState>({ id: 'layers', direction: 'asc' });
    const [page, setPage] = useState(1);
    const dir = (id: string) => (sort?.id === id ? sort.direction : null);
    const cycle = (id: string) => setSort(!sort || sort.id !== id ? { id, direction: 'asc' } : sort.direction === 'asc' ? { id, direction: 'desc' } : null);
    return (
      <div className="sb-stack" style={{ alignItems: 'stretch' }}>
        <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-card)' }}>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search jobs…"
            filters={
              <>
                <TableFilter label="Job" config="text" value={name} onChange={setName} />
                <TableFilter label="Status" config={{ type: 'select', options: ['Printing', 'Queued', 'Paused', 'Completed', 'Failed', 'Canceled'] }} value={status} onChange={setStatus} />
                <TableFilter label="Material" config={{ type: 'select', options: unique('material') }} value={material} onChange={setMaterial} />
              </>
            }
            columnsMenu={<ColumnVisibilityMenu columns={columns} hidden={hidden} onChange={setHidden} />}
            view={view}
            onViewChange={setView}
          />
        </div>
        <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-card)' }}>
          <TableToolbar selectedCount={3} bulkActions={<Button size="sm" variant="danger">Cancel prints</Button>} onClearSelection={fn()} />
        </div>
        <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-card)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderSpacing: 0 }} aria-label="Sortable headers">
            <thead>
              <tr>
                <SortableHeader direction={dir('name')} onSort={() => cycle('name')}>Job</SortableHeader>
                <SortableHeader direction={dir('layers')} onSort={() => cycle('layers')} align="end">Layers</SortableHeader>
                <SortableHeader direction={dir('time')} onSort={() => cycle('time')} align="end">Est. time</SortableHeader>
                <SortableHeader>Status</SortableHeader>
                <SortableHeader data-state="focus" direction={null} onSort={fn()}>Forced focus</SortableHeader>
              </tr>
            </thead>
          </table>
        </div>
        <div className="sb-row" style={{ justifyContent: 'space-between' }}>
          <RowActionsMenu label="Actions for Turbine housing v3" items={staticActions(JOBS[0])} />
          <TablePagination page={page} pageSize={20} total={134} onPageChange={setPage} itemLabel="jobs" />
        </div>
      </div>
    );
  },
};
