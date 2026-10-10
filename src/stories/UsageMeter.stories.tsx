import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { UsageMeter } from '../components/UsageMeter/UsageMeter';

const meta = {
  title: 'Components/Specialized/UsageMeter',
  component: UsageMeter,
  tags: ['expanded'],
  args: {
    label: 'Resin · Grey V5',
    value: 640,
    max: 1000,
    unit: 'mL',
    warnAt: 80,
    dangerAt: 95,
    size: 'sm',
    helper: 'About 9 more prints at the current average.',
    action: { label: 'Order resin', onClick: fn() },
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 1000, step: 10 } },
    max: { control: { type: 'number', min: 1 } },
    warnAt: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    dangerAt: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    label: { control: 'text' },
    helper: { control: 'text' },
    formatValue: { control: false },
  },
  decorators: [(S) => <div className="sb-panel-demo"><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Consumption against a quota: resin cartridge, cloud storage, monthly print hours. Turns warning at `warnAt`% and danger at `dangerAt`% (fill `--color-status-warning`/`--color-status-danger`, amount text in the `-strong` variant, plus an alert icon). Segments split the usage with chart series colours and a legend. Exposed as `role="meter"`.',
      },
    },
  },
} satisfies Meta<typeof UsageMeter>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Thresholds: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack">
      <UsageMeter label="Cloud storage" value={5.1} max={10} unit="GB" helper="51% of your Dashboard plan." />
      <UsageMeter label="Cloud storage" value={8.4} max={10} unit="GB" helper="Running low. Archive old jobs to free space." action={{ label: 'Manage storage', onClick: fn() }} />
      <UsageMeter label="Cloud storage" value={9.7} max={10} unit="GB" helper="Uploads will pause at 10 GB." action={{ label: 'Upgrade plan', onClick: fn() }} />
    </div>
  ),
};

export const Segmented: Story = {
  name: 'Segmented (models vs supports)',
  args: {
    label: 'Resin used this job',
    max: 1000,
    unit: 'mL',
    segments: [
      { id: 'models', label: 'Models', value: 412 },
      { id: 'supports', label: 'Supports', value: 168 },
      { id: 'raft', label: 'Raft', value: 46 },
    ],
    helper: 'Estimated from the sliced layer areas.',
    action: undefined,
  },
};

export const PrintHours: Story = {
  name: 'Print hours this month',
  args: { label: 'Print hours this month', value: 132, max: 160, unit: 'h', helper: 'Fleet of 4 printers · resets 1 Nov', action: { label: 'View history', href: '#history' } },
  argTypes: { value: { control: { type: 'range', min: 0, max: 160, step: 1 } } },
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack">
      <UsageMeter size="sm" label="Tank lifetime" value={52000} max={75000} unit="layers" />
      <UsageMeter size="md" label="Tank lifetime" value={52000} max={75000} unit="layers" />
    </div>
  ),
};

export const OverQuota: Story = {
  args: { label: 'Resin · Clear V4', value: 1040, max: 1000, unit: 'mL', helper: 'Job needs 40 mL more than the cartridge holds. Top up the tank.', action: { label: 'Order resin', onClick: fn() } },
};
