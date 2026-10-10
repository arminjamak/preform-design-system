import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { HistoryIcon, SaveIcon, Trash2Icon } from 'lucide-react';
import { Menu, MenuList } from '../components';

const items = [
  { label: 'Restore to this step…', onSelect: fn(), icon: <HistoryIcon strokeWidth={2.2} /> },
  { label: 'Save as version', onSelect: fn(), icon: <SaveIcon strokeWidth={2.2} />, shortcut: '⌘S' },
  { type: 'separator' as const },
  { label: 'Delete', onSelect: fn(), icon: <Trash2Icon strokeWidth={2.2} />, danger: true },
];

const meta = {
  title: 'Components/Overlays/Menu',
  component: Menu,
  args: { label: 'Actions', items, placement: 'bottom', align: 'end', buttonVariant: 'ghost', buttonSize: 'sm' },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom'] },
    align: { control: 'inline-radio', options: ['start', 'end'] },
    buttonVariant: { control: 'select', options: ['ghost', 'outline', 'floating', 'inverse'] },
    buttonSize: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] },
  },
  decorators: [(S) => <div style={{ padding: 'var(--space-6) var(--space-24) var(--space-24)' }}><S /></div>],
} satisfies Meta<typeof Menu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const ListOnly: Story = {
  name: 'MenuList',
  render: () => (
    <div style={{ width: 'var(--size-layout-sidebar)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-popover)' }}>
      <MenuList items={[{ label: 'Default (Fast)', onSelect: fn(), selected: true }, { label: 'Fine detail', onSelect: fn() }, { label: 'Dental', onSelect: fn(), disabled: true }, ...items.slice(2)]} />
    </div>
  ),
};
