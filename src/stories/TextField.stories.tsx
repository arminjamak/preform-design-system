import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { PencilIcon, SearchIcon } from 'lucide-react';
import { TextField } from '../components';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Inputs/TextField',
  component: TextField,
  args: { label: 'Profile name', value: 'Fine detail', onChange: fn(), placeholder: 'Name this profile', size: 'sm', invalid: false, disabled: false, fullWidth: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    iconStart: { control: 'boolean', mapping: { true: <SearchIcon strokeWidth={2.2} />, false: undefined } },
    iconEnd: { control: 'boolean', mapping: { true: <PencilIcon strokeWidth={2.2} />, false: undefined } },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <TextField {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Search: Story = { args: { value: '', label: 'Search models', placeholder: 'Search…', iconStart: <SearchIcon strokeWidth={2.2} /> } };
export const Invalid: Story = { args: { invalid: true, value: '' } };
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => <StateMatrix render={(p) => <TextField {...args} onChange={() => {}} {...p} />} />,
};
