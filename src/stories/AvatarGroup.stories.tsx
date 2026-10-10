import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarGroup } from '../components/AvatarGroup/AvatarGroup';

const team = [
  { name: 'Armin Jamak' },
  { name: 'Lena Fischer', tone: 'neutral' as const },
  { name: 'Diego Morales', tone: 'inverse' as const },
  { name: 'Priya Natarajan' },
  { name: 'Tomás Lindqvist', tone: 'neutral' as const },
  { name: 'Hana Sato', tone: 'inverse' as const },
  { name: 'Marcus Webb' },
];

const meta = {
  title: 'Components/Data Display/AvatarGroup',
  component: AvatarGroup,
  tags: ['expanded'],
  args: { people: team, max: 4, size: 'sm', label: 'Editing Mini Chassis Kit' },
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] },
    max: { control: { type: 'number', min: 1, max: 8, step: 1 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Overlapping `Avatar`s for collaborators on a print job or shared project. Each avatar gets a `--color-bg-surface` ring so the stack reads on any surface; beyond `max`, a "+N" chip (`--color-bg-muted`) takes the last slot and its `Tooltip` lists the hidden names. The chip is focusable so keyboard users get the tooltip too.',
      },
    },
  },
} satisfies Meta<typeof AvatarGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <AvatarGroup key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const NoOverflow: Story = {
  name: 'Fits within max',
  args: { people: team.slice(0, 3), max: 4 },
};
export const Single: Story = { args: { people: team.slice(0, 1) } };
export const LargeTeam: Story = {
  name: 'Large overflow',
  args: { max: 3, size: 'md' },
};
