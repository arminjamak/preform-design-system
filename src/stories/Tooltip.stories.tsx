import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, InfoTip, Tooltip } from '../components';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  args: { content: 'Profiles store every auto support setting', placement: 'top', open: true, children: <Button variant="outline">Hover me</Button> },
  argTypes: { placement: { control: 'inline-radio', options: ['top', 'bottom'] }, children: { control: false } },
  decorators: [(S) => <div style={{ padding: 'var(--space-8) var(--space-6)' }}><S /></div>],
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const InfoGlyph: Story = {
  name: 'InfoTip',
  render: (args) => <InfoTip label={String(args.content)} placement={args.placement} open={args.open} />,
};
