import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton, SkeletonCard, SkeletonListItem, SkeletonTableRow } from '../components/Skeleton/Skeleton';

const LENGTHS = [undefined, '100%', '60%', '40%', 'space-4', 'space-8', 'space-16', 'space-24', 'size-control-sm', 'size-control-xl', 'size-field-lg'];

const meta = {
  title: 'Components/Feedback/Skeleton',
  component: Skeleton,
  tags: ['expanded'],
  args: { variant: 'text', lines: 3, width: '100%' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['text', 'rect', 'circle'] },
    width: { control: 'select', options: LENGTHS },
    height: { control: 'select', options: LENGTHS },
    lines: { control: { type: 'number', min: 1, max: 8 } },
    radius: { control: 'select', options: [undefined, 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'] },
  },
  decorators: [(S) => <div className="sb-panel-demo"><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Shimmering placeholders shown while models, jobs and printer data load. `width`/`height` take token names (`space-8`, `size-control-sm`) or percentages. Fill is `--color-bg-muted` with a `--color-bg-subtle` sweep; the sweep is removed under prefers-reduced-motion. Presets wrap themselves in a `role="status"` region.',
      },
    },
  },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack">
      <span className="pf-text-caption">text</span>
      <Skeleton variant="text" lines={4} />
      <span className="pf-text-caption">rect</span>
      <Skeleton variant="rect" height="space-24" radius="md" />
      <span className="pf-text-caption">circle</span>
      <div className="sb-row">
        <Skeleton variant="circle" width="size-icon-md" />
        <Skeleton variant="circle" width="size-control-sm" />
        <Skeleton variant="circle" width="size-control-xl" />
      </div>
    </div>
  ),
};

export const Card: Story = {
  name: 'SkeletonCard',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack">
      <SkeletonCard label="Loading job" />
      <SkeletonCard label="Loading material" media={false} lines={3} />
    </div>
  ),
};

export const ListItem: Story = {
  name: 'SkeletonListItem',
  parameters: { controls: { disable: true } },
  render: () => (
    <div>
      <SkeletonListItem label="Loading printers" />
      <SkeletonListItem label="Loading printers" />
      <SkeletonListItem label="Loading printers" secondary={false} trailing={false} />
    </div>
  ),
};

export const TableRow: Story = {
  name: 'SkeletonTableRow',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack">
      <div style={{ width: '100%' }}>
        <SkeletonTableRow label="Loading print history" columns={4} />
        <SkeletonTableRow label="Loading print history" columns={4} />
        <SkeletonTableRow label="Loading print history" columns={4} />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }} className="pf-text-label">
        <thead>
          <tr>
            {['Job', 'Printer', 'Material', 'Duration'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: 'var(--space-2)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRow as="tr" label="Loading print history" columns={4} />
          <SkeletonTableRow as="tr" label="Loading print history" columns={4} />
        </tbody>
      </table>
    </div>
  ),
};
