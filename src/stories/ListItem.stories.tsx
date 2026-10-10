import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { IconButton, ListItem, Menu } from '../components';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Data Display/ListItem',
  component: ListItem,
  args: { label: 'Mini Chassis Kit', selected: false, highlighted: false, muted: false, variant: 'tinted', onClick: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['tinted', 'plain'] },
    leading: { control: false },
    trailing: { control: false },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  decorators: [(S) => <div style={{ width: 'var(--size-layout-sidebar)', background: 'var(--color-bg-surface)' }}><S /></div>],
  render: (args) => <ListItem {...args} leading={args.muted ? <EyeOffIcon strokeWidth={2.2} /> : <EyeIcon strokeWidth={2.4} />} trailing={<Menu label="Model actions" items={[{ label: 'Rename', onSelect: fn() }, { label: 'Duplicate', onSelect: fn() }]} buttonSize="xs" />} />,
} satisfies Meta<typeof ListItem>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const ProjectTree: Story = {
  render: () => (
    <div>
      <ListItem label="Mini Chassis Kit" selected leading={<IconButton label="Hide" icon={<EyeIcon strokeWidth={2.4} />} size="xs" />} onClick={fn()} />
      <ListItem label="Bracket Left" highlighted leading={<IconButton label="Hide" icon={<EyeIcon strokeWidth={2.4} />} size="xs" />} onClick={fn()} />
      <ListItem label="Bracket Right (hidden)" muted leading={<IconButton label="Show" icon={<EyeOffIcon strokeWidth={2.2} />} size="xs" />} onClick={fn()} />
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
        { label: 'default', render: (p) => <div style={{ width: 'var(--size-field-lg)' }}><ListItem label="Model" onClick={fn()} {...p} /></div> },
        { label: 'selected', render: (p) => <div style={{ width: 'var(--size-field-lg)' }}><ListItem label="Model" selected onClick={fn()} {...p} /></div> },
      ]}
    />
  ),
};
