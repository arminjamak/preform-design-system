import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { HomeIcon, MoreVerticalIcon, RulerIcon, SaveIcon, XIcon } from 'lucide-react';
import { IconButton } from '../components';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: { label: 'Close', icon: <XIcon strokeWidth={2.6} />, variant: 'ghost', size: 'sm', shape: 'rounded', onClick: fn() },
  argTypes: {
    variant: { control: 'select', options: ['ghost', 'outline', 'accentOutline', 'filled', 'floating', 'inverse'] },
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] },
    shape: { control: 'inline-radio', options: ['rounded', 'circle'] },
    icon: { control: 'select', options: ['close', 'more', 'save', 'home', 'ruler'], mapping: { close: <XIcon strokeWidth={2.6} />, more: <MoreVerticalIcon strokeWidth={2.4} />, save: <SaveIcon strokeWidth={2.2} />, home: <HomeIcon strokeWidth={2} />, ruler: <RulerIcon strokeWidth={2.2} /> } },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      <IconButton {...args} variant="ghost" label="Ghost" />
      <IconButton {...args} variant="outline" label="Outline" icon={<SaveIcon strokeWidth={2.2} />} />
      <IconButton {...args} variant="accentOutline" label="Accent outline" shape="circle" icon={<RulerIcon strokeWidth={2.2} />} />
      <IconButton {...args} variant="filled" label="Filled" icon={<SaveIcon strokeWidth={2.2} />} />
      <IconButton {...args} variant="floating" label="Floating" shape="circle" icon={<HomeIcon strokeWidth={2} />} />
      <span style={{ background: 'var(--color-bg-inverse)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1)' }}>
        <IconButton {...args} variant="inverse" label="Inverse" icon={<MoreVerticalIcon strokeWidth={2.4} />} />
      </span>
    </div>
  ),
};

export const Pressed: Story = { args: { pressed: true, icon: <RulerIcon strokeWidth={2.2} />, label: 'Measure', variant: 'outline' } };

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={(['ghost', 'outline', 'accentOutline', 'filled', 'floating'] as const).map((v) => ({
        label: v,
        render: (p) => <IconButton {...args} variant={v} {...p} />,
      }))}
    />
  ),
};
