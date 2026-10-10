import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { CodeInput } from '../components/CodeInput/CodeInput';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Inputs/CodeInput',
  component: CodeInput,
  tags: ['expanded'],
  args: {
    label: 'Printer pairing code',
    hideLabel: false,
    length: 6,
    value: '4821',
    onChange: fn(),
    onComplete: fn(),
    mask: false,
    mode: 'numeric',
    size: 'md',
    invalid: false,
    disabled: false,
    autoFocus: false,
  },
  argTypes: {
    length: { control: { type: 'number', min: 2, max: 10 } },
    mode: { control: 'inline-radio', options: ['numeric', 'alphanumeric'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state (1st box)' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'One-time-code / PIN entry for pairing a printer or confirming sign-in. Typing auto-advances, Backspace steps back, arrow keys move, and pasting fills every box; `mask` shows dots for PINs. Boxes share TextField’s border and `--color-focus-ring-soft` halo.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <CodeInput {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
} satisfies Meta<typeof CodeInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const PinMasked: Story = {
  name: 'PIN (masked)',
  args: { label: 'Printer lock PIN', length: 4, value: '19', mask: true },
};

export const Alphanumeric: Story = {
  args: { label: 'Fleet invite code', mode: 'alphanumeric', length: 8, value: 'FL4K' },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <CodeInput key={size} {...args} size={size} label={`Pairing code (${size})`} onChange={() => {}} />
      ))}
    </div>
  ),
};

export const Invalid: Story = {
  args: { value: '482190', invalid: true },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return (
      <div className="sb-stack">
        <CodeInput {...args} value={value} onChange={(v) => update({ value: v })} aria-describedby="pairing-code-error" />
        <p id="pairing-code-error" className="pf-text-label-sm" style={{ color: 'var(--color-status-danger)' }}>
          That code has expired. Request a new one from the printer screen.
        </p>
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
        { label: 'empty', render: (p) => <CodeInput {...args} hideLabel length={4} value="" onChange={() => {}} {...p} /> },
        { label: 'filled', render: (p) => <CodeInput {...args} hideLabel length={4} value="4821" onChange={() => {}} {...p} /> },
        { label: 'invalid', render: (p) => <CodeInput {...args} hideLabel length={4} value="4821" invalid onChange={() => {}} {...p} /> },
      ]}
    />
  ),
};
