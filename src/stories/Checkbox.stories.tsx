import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Checkbox } from '../components';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Inputs/Checkbox',
  component: Checkbox,
  args: { label: 'Show raft', checked: true, onChange: fn(), tone: 'blue', showLabel: true, indeterminate: false, disabled: false },
  argTypes: {
    tone: { control: 'select', options: ['blue', 'green', 'amber', 'red', 'orange', 'magenta'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  render: function Render(args) {
    const [{ checked }, update] = useArgs();
    return <Checkbox {...args} checked={checked} onChange={(v) => update({ checked: v })} />;
  },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Tones: Story = {
  render: (args) => (
    <div className="sb-row">
      {(['blue', 'green', 'amber', 'red', 'orange', 'magenta'] as const).map((t) => (
        <Checkbox key={t} {...args} tone={t} label={t} checked onChange={() => {}} />
      ))}
    </div>
  ),
};
export const Indeterminate: Story = { args: { indeterminate: true, label: 'Some categories' } };
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'unchecked', render: (p) => <Checkbox {...args} showLabel={false} checked={false} onChange={() => {}} {...p} /> },
        { label: 'checked', render: (p) => <Checkbox {...args} showLabel={false} checked onChange={() => {}} {...p} /> },
      ]}
    />
  ),
};
