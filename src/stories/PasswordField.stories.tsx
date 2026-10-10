import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { PasswordField } from '../components/PasswordField/PasswordField';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Inputs/PasswordField',
  component: PasswordField,
  tags: ['expanded'],
  args: {
    label: 'Printer Wi-Fi password',
    hideLabel: false,
    value: 'resin-lab-2024',
    onChange: fn(),
    placeholder: 'Network password',
    showStrength: false,
    defaultVisible: false,
    size: 'sm',
    invalid: false,
    disabled: false,
    fullWidth: false,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Password input with an eye / eye-off IconButton (`aria-pressed`) that reveals the value. `showStrength` adds a PasswordStrengthMeter driven by the `--color-status-*` tokens, for new-account and printer-network setup.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <PasswordField {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
} satisfies Meta<typeof PasswordField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithStrength: Story = {
  args: { label: 'New Dashboard password', value: 'Form4', showStrength: true, placeholder: 'At least 8 characters' },
};

export const Revealed: Story = { args: { defaultVisible: true } };

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <PasswordField key={size} {...args} size={size} label={`Password (${size})`} onChange={() => {}} />
      ))}
    </div>
  ),
};

export const Invalid: Story = { args: { label: 'Current password', invalid: true, value: 'grey-v4' } };

export const InPanel: Story = {
  args: { label: 'Fleet admin password', showStrength: true, value: 'Tough-2000!', fullWidth: true },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return (
      <div className="sb-panel-demo">
        <PasswordField {...args} value={value} onChange={(v) => update({ value: v })} />
      </div>
    );
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'hidden', render: (p) => <PasswordField {...args} hideLabel onChange={() => {}} {...p} /> },
        { label: 'revealed', render: (p) => <PasswordField {...args} hideLabel defaultVisible onChange={() => {}} {...p} /> },
        { label: 'invalid', render: (p) => <PasswordField {...args} hideLabel invalid onChange={() => {}} {...p} /> },
      ]}
    />
  ),
};
