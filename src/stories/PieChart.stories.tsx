import type { Meta, StoryObj } from '@storybook/react-vite';
import { PieChart, type PieChartDatum } from '../components/PieChart/PieChart';

const resinUsage: PieChartDatum[] = [
  { id: 'grey-v5', label: 'Grey V5', value: 4820 },
  { id: 'clear-v5', label: 'Clear V5', value: 2960 },
  { id: 'tough-2000', label: 'Tough 2000', value: 1740 },
  { id: 'draft-v2', label: 'Draft V2', value: 1310 },
  { id: 'flexible-80a', label: 'Flexible 80A', value: 620 },
  { id: 'other', label: 'Other resins', value: 410 },
];

const supportRemoval: PieChartDatum[] = [
  { id: 'clean', label: 'Clean break', value: 312 },
  { id: 'marks', label: 'Visible touchpoints', value: 64 },
  { id: 'damaged', label: 'Surface damage', value: 17 },
];

const litres = (ml: number) => `${(ml / 1000).toFixed(1)} L`;

const meta = {
  title: 'Components/Charts/PieChart',
  component: PieChart,
  tags: ['expanded'],
  args: {
    title: 'Resin usage by material',
    subtitle: 'Last 30 days · all Form 4 printers',
    data: resinUsage,
    donut: false,
    gap: 2,
    hoverOffset: 6,
    showLabels: true,
    showLegend: true,
    legendValue: 'percent',
    legendPosition: 'right',
    size: 200,
    valueFormat: litres,
  },
  argTypes: {
    data: { control: 'object' },
    innerRadius: { control: { type: 'range', min: 0, max: 0.9, step: 0.05 } },
    gap: { control: { type: 'range', min: 0, max: 8, step: 1 } },
    hoverOffset: { control: { type: 'range', min: 0, max: 12, step: 1 } },
    size: { control: { type: 'range', min: 120, max: 320, step: 8 } },
    legendValue: { control: 'inline-radio', options: ['percent', 'value', 'none'] },
    legendPosition: { control: 'inline-radio', options: ['right', 'bottom'] },
    valueFormat: { control: false },
  },
  decorators: [
    (S) => (
      <div style={{ width: 'calc(var(--size-layout-dialog-lg) * 1.1)', maxWidth: '100%' }}>
        <S />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Part-to-whole chart in pie or donut form, e.g. resin usage by material in the PreForm Dashboard. Slices use `--color-chart-series-1…6` (blue first), separated by a constant-width gap; hover or focus (arrow keys) pushes a slice out and shows `ChartTooltip`. The legend doubles as a filter: click an item to hide that slice and re-normalise the shares.',
      },
    },
  },
} satisfies Meta<typeof PieChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Donut: Story = {
  args: { donut: true, centerLabel: 'Resin used', centerValue: '11.9 L' },
};

export const ThinDonut: Story = {
  args: { innerRadius: 0.78, showLabels: false, legendValue: 'value', centerLabel: 'Resin used' },
};

export const LegendBottom: Story = {
  args: { legendPosition: 'bottom', size: 180 },
};

export const NoGap: Story = {
  args: { gap: 0, hoverOffset: 0 },
};

export const FewSlices: Story = {
  args: {
    title: 'Support removal outcome',
    subtitle: 'Last 393 printed parts',
    data: supportRemoval,
    donut: true,
    centerLabel: 'Parts',
    valueFormat: (v: number) => String(v),
    legendValue: 'value',
  },
};

export const Empty: Story = {
  args: { data: [], subtitle: 'No prints in the selected range' },
};
