import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CopyButton } from '../components/CopyButton/CopyButton';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Actions/CopyButton',
  component: CopyButton,
  tags: ['expanded'],
  args: {
    value: 'PJ-2026-0412-MiniChassisKit',
    label: 'Copy job ID',
    copiedLabel: 'Copied',
    variant: 'icon',
    size: 'sm',
    disabled: false,
    tooltipPlacement: 'top',
    onCopied: fn(),
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['icon', 'text'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    tooltipPlacement: { control: 'inline-radio', options: ['top', 'bottom'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  decorators: [(S) => <div style={{ padding: 'var(--space-8)' }}><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Copies `value` with `navigator.clipboard.writeText` from the click handler, falling back to a hidden textarea and `execCommand("copy")` when the Clipboard API is missing or rejects. It then shows a check icon (`status.success-strong`) and a "Copied" tooltip briefly, and announces the result in a polite live region. Used for job IDs, printer serials and share links.',
      },
    },
  },
} satisfies Meta<typeof CopyButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      <CopyButton {...args} variant="icon" />
      <CopyButton {...args} variant="text" label="Copy serial" value="Form4-BrightOtter-0417" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <CopyButton key={size} {...args} size={size} />
      ))}
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <CopyButton key={`t-${size}`} {...args} variant="text" label="Copy" size={size} />
      ))}
    </div>
  ),
};

export const InContext: Story = {
  render: (args) => (
    <div className="sb-row" style={{ gap: 'var(--space-1)' }}>
      <span className="pf-text-mono">{args.value}</span>
      <CopyButton {...args} />
    </div>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'icon', render: (p) => <CopyButton {...args} variant="icon" {...p} /> },
        { label: 'text', render: (p) => <CopyButton {...args} variant="text" label="Copy" {...p} /> },
      ]}
    />
  ),
};
