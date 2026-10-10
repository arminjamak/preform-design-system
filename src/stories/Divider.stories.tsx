import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from '../components';

const meta = {
  title: 'Components/Layout/Divider',
  component: Divider,
  args: { orientation: 'horizontal', tone: 'default', spacing: 'md' },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    tone: { control: 'inline-radio', options: ['default', 'subtle', 'inverse'] },
    spacing: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
  },
  decorators: [(S) => <div className="sb-row" style={{ width: 'var(--size-layout-sidebar)', height: 'var(--size-control-xl)' }}><span className="pf-text-body-sm">Before</span><S /><span className="pf-text-body-sm">After</span></div>],
} satisfies Meta<typeof Divider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Vertical: Story = { args: { orientation: 'vertical' } };
