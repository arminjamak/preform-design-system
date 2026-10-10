import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../components';

const meta = {
  title: 'Components/Data Display/Avatar',
  component: Avatar,
  args: { name: 'Armin Jamak', size: 'xs', tone: 'accent' },
  argTypes: { size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] }, tone: { control: 'inline-radio', options: ['accent', 'neutral', 'inverse'] } },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row">
      <Avatar {...args} size="xs" />
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
    </div>
  ),
};
