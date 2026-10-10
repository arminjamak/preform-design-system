import type { Meta, StoryObj } from '@storybook/react-vite';
import { GripVerticalIcon, PencilIcon, SettingsIcon } from 'lucide-react';
import { Card, IconButton } from '../components';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Card',
  component: Card,
  args: { variant: 'outline', padding: 'md', interactive: false, selected: false, dragging: false, children: null },
  argTypes: {
    variant: { control: 'inline-radio', options: ['outline', 'elevated', 'subtle'] },
    padding: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
    children: { control: false },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  decorators: [(S) => <div className="sb-panel-demo"><S /></div>],
  render: (args) => (
    <Card {...args}>
      <div className="sb-row" style={{ flexWrap: 'nowrap' }}>
        <IconButton label="Drag to reorder" icon={<GripVerticalIcon strokeWidth={2.2} />} size="sm" />
        <span style={{ display: 'inline-flex', width: 'var(--size-control-xl)', height: 'var(--size-control-xl)', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-panel)', border: 'var(--border-width-1) solid var(--color-border-default)' }}>
          <SettingsIcon strokeWidth={2} style={{ width: 'var(--size-icon-sm)', height: 'var(--size-icon-sm)' }} />
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span className="pf-text-body-strong" style={{ display: 'block' }}>Fine detail</span>
          <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>0.4 mm touchpoints · dense</span>
        </span>
        <IconButton label="Rename" icon={<PencilIcon strokeWidth={2.4} />} size="sm" />
      </div>
    </Card>
  ),
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Selected: Story = { args: { interactive: true, selected: true } };
export const States: Story = {
  parameters: { controls: { disable: true } },
  decorators: [],
  render: () => (
    <StateMatrix
      render={(p) => (
        <Card interactive padding="sm" {...p} style={{ width: 'var(--size-field-lg)' }}>
          <span className="pf-text-body-sm">Profile</span>
        </Card>
      )}
    />
  ),
};
