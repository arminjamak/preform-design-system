import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircularProgress } from '../components/CircularProgress/CircularProgress';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const TONES = ['accent', 'success', 'warning', 'danger'] as const;

const meta = {
  title: 'Components/Feedback/CircularProgress',
  component: CircularProgress,
  tags: ['expanded'],
  args: { value: 64, size: 'xl', tone: 'accent', indeterminate: false, label: 'Uploading Bracket_v3.form', showValue: true },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    size: { control: 'inline-radio', options: SIZES },
    tone: { control: 'inline-radio', options: TONES },
  },
  parameters: {
    docs: {
      description: {
        component:
          'SVG ring progress for compact spots: job rows, toolbar status, upload chips. Sized from `--size-icon-*` (xs–lg) and `--size-control-xl` (xl, the only size with centred value text). Track uses `--color-chart-track`; indeterminate rotates a quarter arc, replaced by a static dimmed ring under reduced motion.',
      },
    },
  },
} satisfies Meta<typeof CircularProgress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row">
      {SIZES.map((size) => (
        <CircularProgress key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="sb-row">
      <CircularProgress {...args} tone="accent" value={42} label="Printing" />
      <CircularProgress {...args} tone="success" value={100} label="Print complete" />
      <CircularProgress {...args} tone="warning" value={84} label="Tank lifetime used" />
      <CircularProgress {...args} tone="danger" value={97} label="Resin cartridge used" />
    </div>
  ),
};

export const Indeterminate: Story = {
  args: { indeterminate: true, label: 'Slicing models' },
  render: (args) => (
    <div className="sb-row">
      {SIZES.map((size) => (
        <CircularProgress key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const InJobRow: Story = {
  name: 'In a job row',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack sb-panel-demo">
      {[
        { name: 'Dental_Arch_Upper.form', value: 100, tone: 'success' as const, meta: 'Done' },
        { name: 'Bracket_v3.form', value: 42, tone: 'accent' as const, meta: '42%' },
        { name: 'Turbine_Housing.form', value: 0, tone: 'accent' as const, meta: 'Slicing…', indeterminate: true },
      ].map((job) => (
        <div key={job.name} className="sb-row pf-text-body-sm">
          <CircularProgress size="sm" value={job.value} tone={job.tone} indeterminate={job.indeterminate} label={job.name} />
          <span style={{ flex: 1 }}>{job.name}</span>
          <span className="pf-text-label-sm">{job.meta}</span>
        </div>
      ))}
    </div>
  ),
};
