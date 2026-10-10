import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../components/Card/Card';
import { GaugeChart } from '../components/GaugeChart/GaugeChart';

const WEAR = [
  { at: 0, tone: 'success' as const },
  { at: 70, tone: 'warning' as const },
  { at: 90, tone: 'danger' as const },
];

const meta = {
  title: 'Components/Charts/GaugeChart',
  component: GaugeChart,
  tags: ['expanded'],
  args: { value: 68, min: 0, max: 100, label: 'Tank lifetime used', unit: '%', size: 'md', thresholds: WEAR, showScale: true },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    target: { control: { type: 'number' } },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    thresholds: { control: 'object' },
    formatValue: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Semicircle gauge for a single bounded value: tank lifetime, printer utilisation, resin temperature. Track `--color-chart-track`, value arc toned by `thresholds` (accent by default), optional target tick in `--color-fg-default`, min/max in `--color-chart-label`. Uses the shared `Chart.module.css` frame and is exposed as `role="meter"`.',
      },
    },
  },
} satisfies Meta<typeof GaugeChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row" style={{ alignItems: 'flex-end' }}>
      <GaugeChart {...args} size="sm" />
      <GaugeChart {...args} size="md" />
      <GaugeChart {...args} size="lg" />
    </div>
  ),
};

export const ThresholdTones: Story = {
  name: 'Threshold tones',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-row">
      <GaugeChart size="sm" value={32} unit="%" label="Tank A · Form 4" thresholds={WEAR} />
      <GaugeChart size="sm" value={78} unit="%" label="Tank B · Form 4" thresholds={WEAR} />
      <GaugeChart size="sm" value={94} unit="%" label="Tank C · Form 4L" thresholds={WEAR} />
    </div>
  ),
};

export const WithTarget: Story = {
  name: 'Target tick',
  args: {
    value: 31,
    min: 20,
    max: 40,
    target: 35,
    unit: '°C',
    label: 'Resin temperature',
    thresholds: [
      { at: 20, tone: 'warning' },
      { at: 30, tone: 'success' },
      { at: 38, tone: 'danger' },
    ],
  },
  argTypes: { value: { control: { type: 'range', min: 20, max: 40, step: 0.5 } } },
};

export const Accent: Story = {
  name: 'No thresholds (accent)',
  args: { value: 72, thresholds: undefined, label: 'Fleet utilisation', unit: '%', target: 80 },
};

export const InCard: Story = {
  name: 'In a dashboard card',
  parameters: { controls: { disable: true } },
  render: () => (
    <Card variant="elevated" style={{ width: 'var(--size-layout-panel)' }}>
      <div className="sb-stack" style={{ alignItems: 'center' }}>
        <span className="pf-text-title-sm" style={{ alignSelf: 'flex-start' }}>
          Tank health
        </span>
        <GaugeChart value={61200} min={0} max={75000} target={60000} label="Layers printed" thresholds={[{ at: 0, tone: 'success' }, { at: 60000, tone: 'warning' }, { at: 70000, tone: 'danger' }]} formatValue={(v) => `${Math.round(v / 1000)}k`} />
      </div>
    </Card>
  ),
};
