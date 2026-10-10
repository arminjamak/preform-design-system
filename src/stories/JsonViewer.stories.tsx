import type { Meta, StoryObj } from '@storybook/react-vite';
import { JsonViewer, type JsonValue } from '../components/JsonViewer/JsonViewer';

const printJob: JsonValue = {
  job_id: 'job_7f3c2a91',
  name: 'Dental arch batch — 12 models',
  printer: { model: 'Form 4', serial: 'Form4-SmoothPeacock', firmware: '1.9.2', connection: 'ethernet' },
  material: { code: 'FLGPGR05', name: 'Grey V5', cartridge_ml_remaining: 612, tank: 'Resin Tank V2.1', tank_layers_used: 48210 },
  layer_height_mm: 0.05,
  layer_count: 1650,
  estimated_print_time_s: 7260,
  estimated_volume_ml: 84.6,
  orientation: { mode: 'auto', x_deg: 15, y_deg: 0, z_deg: 32 },
  supports: {
    type: 'auto',
    density: 1,
    touchpoint_size_mm: 0.5,
    internal_supports: true,
    mini_rafts: true,
    mini_rafts_on_build_platform: false,
    raft_type: 'full',
    raft_thickness_mm: 2,
  },
  models: [
    { id: 'm_01', file: 'upper_arch_UR.stl', triangles: 284112, has_supports: true, z_height_mm: 31.4 },
    { id: 'm_02', file: 'lower_arch_LL.stl', triangles: 271804, has_supports: true, z_height_mm: 29.9 },
    { id: 'm_03', file: 'die_tooth_14.stl', triangles: 48210, has_supports: false, z_height_mm: 12.2 },
  ],
  validation: { status: 'passed', warnings: [], minima_unsupported: 0, cups_detected: 0 },
  remote_print_token: null,
};

const printersResponse: JsonValue = {
  printers: [
    {
      serial: 'Form4-SmoothPeacock',
      product_name: 'Form 4',
      status: 'PRINTING',
      ip_address: '192.168.1.42',
      firmware_version: '1.9.2',
      current_print: { job_id: 'job_7f3c2a91', layer: 412, layer_count: 1650, eta_s: 5440 },
      resin_temperature_c: 35.1,
      tank: { material_code: 'FLGPGR05', layers_printed: 48622 },
    },
    {
      serial: 'Form4B-CleverHeron',
      product_name: 'Form 4B',
      status: 'IDLE',
      ip_address: '192.168.1.57',
      firmware_version: '1.9.2',
      current_print: null,
      resin_temperature_c: 24.8,
      tank: { material_code: 'FLDGOR01', layers_printed: 9120 },
    },
    {
      serial: 'Form3L-AgileOtter',
      product_name: 'Form 3L',
      status: 'ERROR',
      ip_address: '192.168.1.63',
      firmware_version: '1.18.0',
      current_print: null,
      error: { code: 'E0301', message: 'Cartridge valve did not open' },
      tank: { material_code: 'FLTO2001', layers_printed: 22014 },
    },
  ],
  count: 3,
  fetched_at: '2026-10-10T09:14:22.418Z',
};

const meta = {
  title: 'Components/Specialized/JsonViewer',
  component: JsonViewer,
  tags: ['expanded'],
  args: { data: printJob, defaultExpandDepth: 2, rootName: 'print_job', searchable: true, maxHeight: undefined },
  argTypes: {
    data: { control: 'object' },
    defaultExpandDepth: { control: { type: 'range', min: 0, max: 5, step: 1 } },
    rootName: { control: 'text' },
    searchable: { control: 'boolean' },
    maxHeight: {
      control: 'select',
      options: [undefined, 'calc(var(--space-24) * 2)', 'calc(var(--space-24) * 3)', 'var(--size-layout-panel)'],
    },
    'data-state': { control: 'inline-radio', options: [undefined, 'focus'], name: 'forced state (root row)' },
  },
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-lg)' }}><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Collapsible JSON tree for print jobs and printer API responses, with counts on collapsed nodes, expand/collapse all, copy path or value (P / C on the focused row) and search highlight. Syntax colours come from --color-fg-accent, --color-status-success-strong, --color-status-warning-strong and --color-accent-tone-magenta.',
      },
    },
  },
} satisfies Meta<typeof JsonViewer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const PrinterApiResponse: Story = {
  args: { data: printersResponse, rootName: 'response', defaultExpandDepth: 3, maxHeight: 'var(--size-layout-panel)' },
};

export const Collapsed: Story = {
  name: 'Collapsed (depth 1)',
  args: { defaultExpandDepth: 1 },
};

export const WithoutSearch: Story = {
  args: { searchable: false, data: printJob, defaultExpandDepth: 1 },
};

export const FocusedRow: Story = {
  args: { 'data-state': 'focus', defaultExpandDepth: 1 },
};
