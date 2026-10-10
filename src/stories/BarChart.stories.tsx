import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarChart, type BarDatum } from '../components/BarChart/BarChart';
import { formatNumber } from '../components/Chart/scales';

const printers = [
  { id: 'form4', label: 'Form 4' },
  { id: 'form4l', label: 'Form 4L' },
  { id: 'form3plus', label: 'Form 3+' },
];

const printsPerWeek: BarDatum[] = [
  { label: 'W31', values: { form4: 42, form4l: 18, form3plus: 27 } },
  { label: 'W32', values: { form4: 47, form4l: 21, form3plus: 24 } },
  { label: 'W33', values: { form4: 39, form4l: 16, form3plus: 29 } },
  { label: 'W34', values: { form4: 51, form4l: 23, form3plus: 22 } },
  { label: 'W35', values: { form4: 55, form4l: 19, form3plus: 25 } },
  { label: 'W36', values: { form4: 48, form4l: 26, form3plus: 20 } },
  { label: 'W37', values: { form4: 58, form4l: 24, form3plus: 18 } },
  { label: 'W38', values: { form4: 61, form4l: 28, form3plus: 21 } },
];

const resinByMaterial: BarDatum[] = [
  { label: 'Grey Resin V5', values: { ml: 14250 } },
  { label: 'Clear Resin V5', values: { ml: 9800 } },
  { label: 'Tough 2000', values: { ml: 7420 } },
  { label: 'Black Resin V5', values: { ml: 6150 } },
  { label: 'Rigid 10K', values: { ml: 3380 } },
  { label: 'Elastic 50A', values: { ml: 1240 } },
];

const weekOverWeek: BarDatum[] = [
  { label: 'W32', values: { form4: 5, form4l: 3, form3plus: -3 } },
  { label: 'W33', values: { form4: -8, form4l: -5, form3plus: 5 } },
  { label: 'W34', values: { form4: 12, form4l: 7, form3plus: -7 } },
  { label: 'W35', values: { form4: 4, form4l: -4, form3plus: 3 } },
  { label: 'W36', values: { form4: -7, form4l: 7, form3plus: -5 } },
  { label: 'W37', values: { form4: 10, form4l: -2, form3plus: -2 } },
];

const mL = (v: number) => `${formatNumber(v)} mL`;
const signed = (v: number) => (v > 0 ? `+${v}` : String(v));

const meta = {
  title: 'Components/Charts/BarChart',
  component: BarChart,
  tags: ['expanded'],
  args: {
    title: 'Prints per week',
    subtitle: 'Completed jobs by printer, last 8 weeks',
    data: printsPerWeek,
    series: printers,
    orientation: 'vertical',
    mode: 'grouped',
    showValues: false,
    height: 240,
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    mode: { control: 'inline-radio', options: ['grouped', 'stacked'] },
    showValues: { control: 'boolean' },
    showLegend: { control: 'boolean' },
    height: { control: { type: 'range', min: 120, max: 400, step: 8 } },
    data: { control: 'object' },
    series: { control: 'object' },
    valueFormat: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Categorical comparison for fleet dashboards: prints per week by printer, resin used per material. Vertical or horizontal, grouped or stacked, with negative values. Built on the shared Chart pieces; colours come from --color-chart-series-*, gridlines from --color-chart-grid and labels from --color-chart-label.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: 'calc(var(--size-layout-dialog-lg) * 1.25)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BarChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Stacked: Story = {
  args: { mode: 'stacked', showValues: true, title: 'Fleet output', subtitle: 'Prints per week, stacked by printer' },
};

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    title: 'Resin consumption by material',
    subtitle: 'Last 12 months, all printers',
    data: resinByMaterial,
    series: [{ id: 'ml', label: 'Resin used' }],
    showValues: true,
    showLegend: false,
    valueFormat: mL,
    height: 220,
  },
};

export const HorizontalStacked: Story = {
  args: { orientation: 'horizontal', mode: 'stacked', height: 280, title: 'Prints per week', subtitle: 'Stacked by printer' },
};

export const SingleSeries: Story = {
  args: {
    title: 'Form 4 prints per week',
    series: [printers[0]],
    showValues: true,
    showLegend: false,
  },
};

export const NegativeValues: Story = {
  args: {
    title: 'Week-over-week change',
    subtitle: 'Difference in completed prints vs the previous week',
    data: weekOverWeek,
    showValues: true,
    valueFormat: signed,
  },
};

export const Empty: Story = {
  args: { title: 'Prints per week', subtitle: 'No printers connected', data: [] },
};
