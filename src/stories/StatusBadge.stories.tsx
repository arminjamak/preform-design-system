import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge, type PrintStatus } from '../components/StatusBadge/StatusBadge';

const STATUSES: PrintStatus[] = ['printing', 'queued', 'paused', 'complete', 'failed', 'offline'];

const meta = {
  title: 'Components/Feedback/StatusBadge',
  component: StatusBadge,
  tags: ['expanded'],
  args: { status: 'printing', size: 'md', label: 'Printing · 42%' },
  argTypes: {
    status: { control: 'select', options: STATUSES },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    label: { control: 'text' },
    pulse: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Status pill with a leading dot for print jobs and printers. Printing uses the accent and a pulsing dot (disabled under `prefers-reduced-motion`); the rest map to `--color-status-*` soft washes. Offline is outlined so it reads without colour.',
      },
    },
  },
} satisfies Meta<typeof StatusBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllStatuses: Story = {
  parameters: { controls: { include: ['size'] } },
  render: (args) => (
    <div className="sb-row">
      {STATUSES.map((st) => (
        <StatusBadge key={st} size={args.size} status={st} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  parameters: { controls: { include: ['status'] } },
  render: (args) => (
    <div className="sb-stack">
      <StatusBadge status={args.status} size="sm" />
      <StatusBadge status={args.status} size="md" />
    </div>
  ),
};

export const CustomLabels: Story = {
  parameters: { controls: { include: ['size'] } },
  render: (args) => (
    <div className="sb-row">
      <StatusBadge size={args.size} status="printing" label="Printing · layer 412 of 1,412" />
      <StatusBadge size={args.size} status="queued" label="Queued · 2nd" />
      <StatusBadge size={args.size} status="paused" label="Paused · Resin low" />
      <StatusBadge size={args.size} status="failed" label="Failed · Tank not detected" />
    </div>
  ),
};

const jobs: Array<{ name: string; printer: string; status: PrintStatus; label?: string }> = [
  { name: 'Bracket_v3', printer: 'Form 4 · Studio', status: 'printing', label: 'Printing · 42%' },
  { name: 'Dental_model_upper', printer: 'Form 4B · Lab', status: 'queued' },
  { name: 'Gear_housing', printer: 'Form 3+ · Bench', status: 'paused' },
  { name: 'Hinge_clip_x8', printer: 'Form 4 · Studio', status: 'complete' },
  { name: 'Lattice_insole', printer: 'Form 3L · Shop', status: 'failed' },
  { name: 'Lens_mount', printer: 'Form 3 · Annex', status: 'offline' },
];

/** In context: the print queue in a 300px panel. */
export const InQueue: Story = {
  parameters: { controls: { include: ['size'] } },
  render: (args) => (
    <ul className="sb-panel-demo" style={{ margin: 0, padding: 0, listStyle: 'none', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-card)' }}>
      {jobs.map((j) => (
        <li
          key={j.name}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', borderBottom: 'var(--border-width-1) solid var(--color-border-subtle)' }}
        >
          <span style={{ minWidth: 0 }}>
            <span className="pf-text-label" style={{ display: 'block' }}>{j.name}</span>
            <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>{j.printer}</span>
          </span>
          <StatusBadge size={args.size} status={j.status} label={j.label} />
        </li>
      ))}
    </ul>
  ),
};
