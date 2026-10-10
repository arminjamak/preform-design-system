import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Slider } from '../components';

const meta = {
  title: 'Components/Inputs/Slider',
  component: Slider,
  args: { label: 'Brush size', value: 40, onChange: fn(), min: 0, max: 100, step: 1, variant: 'fill', showValue: true, disabled: false },
  argTypes: {
    variant: { control: 'inline-radio', options: ['fill', 'soft'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  decorators: [(S) => <div className="sb-panel-demo"><S /></div>],
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <Slider {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
} satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Soft: Story = { args: { variant: 'soft', label: 'Texture depth', showValue: false } };
export const Disabled: Story = { args: { disabled: true } };
