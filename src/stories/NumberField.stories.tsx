import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { NumberField } from '../components';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Inputs/NumberField',
  component: NumberField,
  args: { label: 'Touchpoint size', value: 0.6, onChange: fn(), unit: 'mm', step: 0.05, min: 0, max: 5, decimals: 2, size: 'sm', disabled: false, invalid: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <NumberField {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
} satisfies Meta<typeof NumberField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Integer: Story = { args: { label: 'Copies', value: 3, decimals: 0, step: 1, unit: undefined, max: 99 } };
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => <StateMatrix render={(p) => <NumberField {...args} onChange={() => {}} {...p} />} />,
};
