import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Toggle } from '../components';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Inputs/Toggle',
  component: Toggle,
  args: { label: 'Undersupported Models', checked: true, onChange: fn(), size: 'sm', showLabel: false, disabled: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  render: function Render(args) {
    const [{ checked }, update] = useArgs();
    return <Toggle {...args} checked={checked} onChange={(v) => update({ checked: v })} />;
  },
} satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithLabel: Story = { args: { showLabel: true } };
export const Medium: Story = { args: { size: 'md' } };

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'off', render: (p) => <Toggle {...args} checked={false} onChange={() => {}} {...p} /> },
        { label: 'on', render: (p) => <Toggle {...args} checked onChange={() => {}} {...p} /> },
      ]}
    />
  ),
};
