import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { CloudIcon, PrinterIcon } from 'lucide-react';
import { Tabs } from '../components';

const meta = {
  title: 'Components/Navigation/Tabs',
  component: Tabs,
  args: {
    label: 'App sections',
    value: 'preform',
    onChange: fn(),
    variant: 'inverse',
    items: [
      { value: 'preform', label: 'PreForm', icon: <PrinterIcon strokeWidth={1.8} /> },
      { value: 'dashboard', label: 'Dashboard', icon: <CloudIcon strokeWidth={1.6} /> },
      { value: 'store', label: 'Store', disabled: true },
    ],
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'inverse'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state (2nd tab)' },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <Tabs {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Default: Story = { args: { variant: 'default', items: [{ value: 'history', label: 'History' }, { value: 'versions', label: 'Saved versions' }] } };
