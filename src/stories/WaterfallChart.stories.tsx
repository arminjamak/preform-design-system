import type { Meta, StoryObj } from '@storybook/react-vite';
import { WaterfallChart, type WaterfallStep } from '../components/WaterfallChart/WaterfallChart';

const monthlyCost: WaterfallStep[] = [
  { label: 'September', value: 18240, type: 'total' },
  { label: 'Resin usage', value: 2310 },
  { label: 'Tank replacements', value: 640 },
  { label: 'Build platforms', value: 180 },
  { label: 'Fewer failed prints', value: -920 },
  { label: 'Bulk resin discount', value: -1150 },
  { label: 'Automated wash', value: -760 },
  { label: 'October', value: 18540, type: 'total' },
];

const quarterly: WaterfallStep[] = [
  { label: 'Q2 spend', value: 52400, type: 'total' },
  { label: 'Form 4L lease', value: 6800 },
  { label: 'Resin', value: 4100 },
  { label: 'Maintenance', value: -1300 },
  { label: 'July–Aug', value: 62000, type: 'total' },
  { label: 'Failed prints', value: -2600 },
  { label: 'Energy', value: 900 },
  { label: 'Q3 spend', value: 60300, type: 'total' },
];

const dollars = (v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`);

const meta = {
  title: 'Components/Charts/WaterfallChart',
  component: WaterfallChart,
  tags: ['expanded'],
  args: {
    title: 'Monthly print cost',
    subtitle: 'What moved spend from September to October',
    steps: monthlyCost,
    showConnectors: true,
    showValues: true,
    showLegend: true,
    height: 200,
    valueFormat: dollars,
  },
  argTypes: {
    steps: { control: 'object' },
    height: { control: { type: 'range', min: 120, max: 320, step: 8 } },
    valueFormat: { control: false },
  },
  decorators: [
    (S) => (
      <div style={{ width: 'calc(var(--size-layout-dialog-lg) * 1.3)', maxWidth: '100%' }}>
        <S />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Running-total chart that explains how a value moved between totals, e.g. monthly print cost. Increases use `--color-status-success`, decreases `--color-status-danger` and totals `--color-chart-series-1`; dashed `--color-chart-axis` connectors carry the running level from bar to bar. A `total` step is drawn from zero to its own value and the running sum continues from it.',
      },
    },
  },
} satisfies Meta<typeof WaterfallChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithSubtotals: Story = {
  args: { title: 'Quarterly print spend', subtitle: 'Q2 → Q3, with a mid-quarter subtotal', steps: quarterly, yAxisTitle: 'USD' },
};

export const NoConnectors: Story = {
  args: { showConnectors: false },
};

export const Minimal: Story = {
  args: { showValues: false, showLegend: false, height: 140 },
};

export const Empty: Story = {
  args: { steps: [], subtitle: 'No cost data for this month' },
};
