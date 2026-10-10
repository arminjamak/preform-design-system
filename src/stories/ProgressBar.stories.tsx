import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from '../components/ProgressBar/ProgressBar';

const TONES = ['accent', 'success', 'warning', 'danger'] as const;

const meta = {
  title: 'Components/Feedback/ProgressBar',
  component: ProgressBar,
  tags: ['expanded'],
  args: {
    label: 'Printing Dental_Arch_Upper.form',
    value: 64,
    max: 100,
    indeterminate: false,
    size: 'sm',
    tone: 'accent',
    showValue: true,
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: { type: 'number', min: 1 } },
    buffer: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    tone: { control: 'inline-radio', options: TONES },
    label: { control: 'text' },
    formatValue: { control: false },
  },
  decorators: [(S) => <div className="sb-panel-demo"><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Linear progress for print jobs, slicing and uploads. Determinate or indeterminate (sliding segment), with an optional buffer value. Track uses `--color-chart-track`; fill follows `--color-bg-accent` or the `--color-status-*` tones. Under reduced motion the indeterminate bar becomes a static dimmed fill.',
      },
    },
  },
} satisfies Meta<typeof ProgressBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      <ProgressBar {...args} size="sm" label="Uploading to Form 4 · sm" value={38} />
      <ProgressBar {...args} size="md" label="Uploading to Form 4 · md" value={38} />
    </div>
  ),
};

export const Tones: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack">
      <ProgressBar label="Printing Bracket_v3.form" value={42} tone="accent" showValue />
      <ProgressBar label="Print complete · 1 h 52 min" value={100} tone="success" showValue />
      <ProgressBar label="Tank lifetime used" value={84} tone="warning" showValue />
      <ProgressBar label="Resin cartridge used" value={97} tone="danger" showValue />
    </div>
  ),
};

export const Indeterminate: Story = {
  args: { label: 'Slicing 3 models…', indeterminate: true },
};

export const WithBuffer: Story = {
  name: 'Buffer (sliced ahead of uploaded)',
  args: { label: 'Sending job to Form 4L', value: 48, buffer: 76, size: 'md' },
};

export const LayerCount: Story = {
  name: 'Custom value format',
  args: {
    label: 'Printing Turbine_Housing.form',
    value: 642,
    max: 1180,
    formatValue: (v, max) => `Layer ${v} of ${max}`,
  },
  argTypes: { value: { control: { type: 'range', min: 0, max: 1180, step: 1 } } },
};

export const NoLabel: Story = {
  name: 'Bare bar (aria-label)',
  args: { label: undefined, showValue: false, 'aria-label': 'Print progress', value: 72 },
};
