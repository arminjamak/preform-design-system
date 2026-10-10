import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Segmented } from '../components';

const options = [
  { value: 'auto', label: 'Auto' },
  { value: 'manual', label: 'Manual' },
  { value: 'none', label: 'None' },
];

const meta = {
  title: 'Components/Segmented',
  component: Segmented,
  args: { label: 'Orientation mode', value: 'auto', options, onChange: fn(), size: 'md', fullWidth: false, disabled: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state (1st option)' },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <Segmented {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
} satisfies Meta<typeof Segmented>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      <Segmented {...args} size="sm" onChange={() => {}} />
      <Segmented {...args} size="md" onChange={() => {}} />
      <Segmented {...args} size="lg" onChange={() => {}} />
    </div>
  ),
};
export const FullWidth: Story = { args: { fullWidth: true }, decorators: [(S) => <div className="sb-panel-demo"><S /></div>] };
export const Disabled: Story = { args: { disabled: true } };
