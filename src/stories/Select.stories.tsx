import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Select } from '../components';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Select',
  component: Select,
  args: { label: 'Material', value: 'Alumina 4N V1', onChange: fn(), options: ['Alumina 4N V1', 'Clear V4', 'Tough 2000', 'Rigid 10K'], size: 'sm', invalid: false, disabled: false, fullWidth: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <Select {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Invalid: Story = { args: { invalid: true } };
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => <StateMatrix render={(p) => <Select {...args} onChange={() => {}} {...p} />} />,
};
