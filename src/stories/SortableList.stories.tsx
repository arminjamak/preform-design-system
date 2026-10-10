import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { useState, type CSSProperties } from 'react';
import { GemIcon, PencilIcon, SmileIcon, SparklesIcon, TargetIcon, ZapIcon, type LucideIcon } from 'lucide-react';
import { Card } from '../components/Card/Card';
import { IconButton } from '../components/IconButton/IconButton';
import { Badge } from '../components/Badge/Badge';
import { DragHandle, SortableList, type SortableListProps } from '../components/SortableList/SortableList';
import { StateMatrix } from './helpers/StateMatrix';

type Profile = { id: string; name: string; description: string; icon: LucideIcon };

const profiles: Profile[] = [
  { id: 'default', name: 'Default (Fast)', description: '0.50 mm touchpoints · density 1.00', icon: ZapIcon },
  { id: 'fine', name: 'Fine detail', description: '0.40 mm touchpoints · dense internal supports', icon: SparklesIcon },
  { id: 'dental', name: 'Dental models', description: '0.35 mm touchpoints · flat base, no raft', icon: SmileIcon },
  { id: 'jewelry', name: 'Castable jewelry', description: '0.30 mm touchpoints · mini raft', icon: GemIcon },
  { id: 'eng', name: 'Engineering parts', description: '0.55 mm touchpoints · full raft', icon: TargetIcon },
];

const tile: CSSProperties = {
  display: 'inline-flex',
  flex: 'none',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'var(--size-control-lg)',
  height: 'var(--size-control-lg)',
  borderRadius: 'var(--radius-lg)',
  border: 'var(--border-width-1) solid var(--color-border-default)',
  background: 'var(--color-bg-panel)',
  color: 'var(--color-fg-default)',
};
const iconSize: CSSProperties = { width: 'var(--size-icon-sm)', height: 'var(--size-icon-sm)' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' };
const textCol: CSSProperties = { minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' };
const muted: CSSProperties = { color: 'var(--color-fg-muted)' };

const renderProfile: SortableListProps<Profile>['renderItem'] = (p, { handleProps }) => {
  const Icon = p.icon;
  return (
    <Card padding="sm" style={{ paddingLeft: 'var(--space-1)' }}>
      <div style={row}>
        <DragHandle label={`Reorder ${p.name}`} size="md" {...handleProps} />
        <span style={tile}>
          <Icon strokeWidth={2} style={iconSize} aria-hidden="true" />
        </span>
        <span style={textCol}>
          <span className="pf-text-body-strong">{p.name}</span>
          <span className="pf-text-label-sm" style={muted}>
            {p.description}
          </span>
        </span>
        <IconButton label={`Rename ${p.name}`} icon={<PencilIcon strokeWidth={2.4} />} />
      </div>
    </Card>
  );
};

const meta = {
  title: 'Components/Interaction/SortableList',
  component: SortableList,
  tags: ['expanded'],
  args: {
    label: 'Saved support profiles',
    items: profiles,
    getId: (p: Profile) => p.id,
    getItemLabel: (p: Profile) => p.name,
    renderItem: renderProfile,
    onReorder: fn(),
    gap: 'sm',
    disabled: false,
    previewDragId: undefined,
  },
  argTypes: {
    gap: { control: 'inline-radio', options: ['none', 'xs', 'sm', 'md'] },
    previewDragId: { control: 'select', options: [undefined, ...profiles.map((p) => p.id)] },
    items: { control: 'object' },
    getId: { control: false },
    getItemLabel: { control: false },
    renderItem: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Drag-to-reorder list from the Manage Saved Profiles dialog. Drag by the grip (pointer) or focus it and press Space, the arrow keys, then Space again; Escape cancels and every step is announced. The lifted card uses `--elevation-popover` and the drop slot `--color-bg-accent-subtle` with a dashed `--color-border-accent` outline; neighbours glide with `--motion-duration-base`.',
      },
    },
  },
  decorators: [(S) => <div style={{ width: 'var(--size-layout-dialog-md)' }}><S /></div>],
  render: function Render(args) {
    const [{ items }, update] = useArgs<{ items: Profile[] }>();
    return (
      <SortableList<Profile>
        {...(args as SortableListProps<Profile>)}
        items={items}
        onReorder={(next) => {
          args.onReorder(next);
          update({ items: next });
        }}
      />
    );
  },
} satisfies Meta<SortableListProps<Profile>>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

type Job = { id: string; name: string; material: string; layers: number };
const queue: Job[] = [
  { id: 'j1', name: 'Bracket_v3.stl', material: 'Grey V5', layers: 1240 },
  { id: 'j2', name: 'Crown_set_14.form', material: 'Dental LT Clear V2', layers: 612 },
  { id: 'j3', name: 'Impeller_housing.stl', material: 'Tough 2000', layers: 2104 },
  { id: 'j4', name: 'Ring_signet_7.stl', material: 'Castable Wax 40', layers: 388 },
];

/** Dense print-queue rows with the small handle and no gap between rows. */
export const DenseQueue: Story = {
  render: function Render() {
    const [list, setList] = useState(queue);
    return (
      <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-card)', padding: 'var(--space-1)' }}>
        <SortableList<Job>
          label="Print queue for Form 4 · Lab bench 2"
          items={list}
          gap="none"
          getId={(j) => j.id}
          getItemLabel={(j) => j.name}
          onReorder={setList}
          renderItem={(j, { handleProps, index, isDragging }) => (
            <div
              style={{
                ...row,
                minHeight: 'var(--size-control-lg)',
                paddingRight: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                background: isDragging ? 'var(--color-bg-surface)' : 'transparent',
              }}
            >
              <DragHandle label={`Reorder ${j.name}`} {...handleProps} />
              <span className="pf-text-label-sm" style={{ ...muted, width: 'var(--space-4)' }}>
                {index + 1}
              </span>
              <span className="pf-text-body-sm" style={{ flex: 1, minWidth: 0 }}>
                {j.name}
              </span>
              <Badge>{j.material}</Badge>
              <span className="pf-text-label-sm" style={muted}>
                {j.layers.toLocaleString()} layers
              </span>
            </div>
          )}
        />
      </div>
    );
  },
};

/** Frozen mid-drag: the "Fine detail" card is lifted (keyboard style) above its slot. */
export const Lifted: Story = { args: { previewDragId: 'fine' } };

export const Disabled: Story = { args: { disabled: true } };

export const DragHandles: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-row">
      <DragHandle label="Reorder (small, vertical)" />
      <DragHandle label="Reorder (medium, vertical)" size="md" />
      <DragHandle label="Reorder (small, horizontal)" orientation="horizontal" />
      <DragHandle label="Reorder (medium, horizontal)" size="md" orientation="horizontal" />
      <DragHandle label="Reorder (grabbed)" size="md" aria-grabbed />
    </div>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  decorators: [],
  render: () => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'sm', render: (p) => <DragHandle label="Reorder Fine detail" {...p} /> },
        { label: 'md', render: (p) => <DragHandle label="Reorder Fine detail" size="md" {...p} /> },
        { label: 'horizontal', render: (p) => <DragHandle label="Reorder Printing column" size="md" orientation="horizontal" {...p} /> },
      ]}
    />
  ),
};
