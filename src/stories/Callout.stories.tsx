import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ChevronRightIcon } from 'lucide-react';
import { Button, Callout } from '../components';

const meta = {
  title: 'Components/Feedback/Callout',
  component: Callout,
  args: { tone: 'info', variant: 'soft', title: 'Ready to print', children: '128 touchpoints generated.' },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'info', 'success', 'warning', 'danger'] },
    variant: { control: 'inline-radio', options: ['soft', 'strip'] },
    action: { control: 'boolean', mapping: { true: <Button variant="link">Fix</Button>, false: undefined } },
    icon: { control: false },
  },
  decorators: [(S) => <div className="sb-panel-demo"><S /></div>],
} satisfies Meta<typeof Callout>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Tones: Story = {
  render: (args) => (
    <div className="sb-stack" style={{ alignItems: 'stretch' }}>
      {(['neutral', 'info', 'success', 'warning', 'danger'] as const).map((t) => (
        <Callout key={t} {...args} tone={t} title={t} />
      ))}
    </div>
  ),
};
export const Strip: Story = {
  args: { variant: 'strip', tone: 'danger', title: undefined, children: 'Models Need More Support', onClick: fn(), action: <ChevronRightIcon strokeWidth={2.4} style={{ width: 'var(--size-icon-xs)', height: 'var(--size-icon-xs)' }} /> },
};
