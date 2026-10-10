import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from '../components';

const meta = {
  title: 'Components/Feedback/Spinner',
  component: Spinner,
  args: { size: 'sm', tone: 'accent' },
  argTypes: { size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] }, tone: { control: 'inline-radio', options: ['current', 'accent', 'muted'] } },
} satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Sizes: Story = { render: (args) => <div className="sb-row"><Spinner {...args} size="xs" /><Spinner {...args} size="sm" /><Spinner {...args} size="md" /><Spinner {...args} size="lg" /></div> };
