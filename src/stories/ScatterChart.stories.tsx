import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScatterChart, type ScatterSeries } from '../components/ScatterChart/ScatterChart';

/** Failure rate (%) of individual print jobs vs layer height (mm), per printer. */
const failureVsLayer: ScatterSeries[] = [
  {
    id: 'form4',
    label: 'Form 4',
    points: [
      { x: 0.025, y: 3.9 },
      { x: 0.025, y: 4.6 },
      { x: 0.05, y: 3.1 },
      { x: 0.05, y: 2.6 },
      { x: 0.1, y: 2.2 },
      { x: 0.1, y: 1.7 },
      { x: 0.16, y: 1.4 },
      { x: 0.16, y: 1.9 },
      { x: 0.2, y: 1.2 },
      { x: 0.2, y: 1.6 },
    ],
  },
  {
    id: 'form3plus',
    label: 'Form 3+',
    points: [
      { x: 0.025, y: 6.8 },
      { x: 0.025, y: 7.4 },
      { x: 0.05, y: 5.2 },
      { x: 0.05, y: 4.4 },
      { x: 0.1, y: 3.6 },
      { x: 0.1, y: 3.0 },
      { x: 0.16, y: 2.9 },
      { x: 0.2, y: 2.4 },
      { x: 0.3, y: 2.1 },
    ],
  },
];

/** Print time (h) vs part volume (mL); bubble size is the number of parts on the build platform. */
const timeVsVolume: ScatterSeries[] = [
  {
    id: 'form4',
    label: 'Form 4',
    points: [
      { x: 12, y: 1.1, size: 1, label: 'Bracket_v3' },
      { x: 28, y: 1.6, size: 4, label: 'Dental model set' },
      { x: 46, y: 2.2, size: 2, label: 'Gear housing' },
      { x: 74, y: 2.9, size: 8, label: 'Hearing aid shells' },
      { x: 95, y: 3.4, size: 3, label: 'Manifold' },
      { x: 130, y: 4.3, size: 12, label: 'Jewelry tree' },
    ],
  },
  {
    id: 'form4l',
    label: 'Form 4L',
    points: [
      { x: 160, y: 4.1, size: 2, label: 'Drone frame' },
      { x: 240, y: 5.6, size: 6, label: 'Fixture plate set' },
      { x: 310, y: 6.8, size: 1, label: 'Helmet shell' },
      { x: 420, y: 8.9, size: 16, label: 'Batch: clip housings' },
    ],
  },
  {
    id: 'form3plus',
    label: 'Form 3+',
    points: [
      { x: 18, y: 2.4, size: 1, label: 'Ring prototype' },
      { x: 55, y: 4.2, size: 5, label: 'Splint set' },
      { x: 88, y: 5.9, size: 2, label: 'Impeller' },
      { x: 120, y: 7.1, size: 9, label: 'Miniatures batch' },
    ],
  },
];

const meta = {
  title: 'Components/Charts/ScatterChart',
  component: ScatterChart,
  tags: ['expanded'],
  args: {
    title: 'Failure rate vs layer height',
    subtitle: 'Each dot is one week of jobs on one printer',
    series: failureVsLayer,
    xLabel: 'Layer height (mm)',
    yLabel: 'Failure rate (%)',
    showTrend: false,
    height: 260,
    sizeRange: [3, 14],
    xFormat: (v: number) => String(v),
    yFormat: (v: number) => `${v}%`,
  },
  argTypes: {
    showTrend: { control: 'boolean' },
    showLegend: { control: 'boolean' },
    height: { control: { type: 'range', min: 160, max: 420, step: 8 } },
    sizeRange: { control: 'object' },
    series: { control: 'object' },
    xFormat: { control: false },
    yFormat: { control: false },
    sizeFormat: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Scatter plot and bubble chart for correlations in print data: failure rate vs layer height, print time vs part volume. Optional size channel (scaled by area) and least-squares trend lines per series. Colours from --color-chart-series-*.',
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
} satisfies Meta<typeof ScatterChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithTrend: Story = { args: { showTrend: true } };

export const Bubble: Story = {
  args: {
    title: 'Print time vs part volume',
    subtitle: 'Bubble size: parts on the build platform',
    series: timeVsVolume,
    xLabel: 'Part volume (mL)',
    yLabel: 'Print time (h)',
    sizeLabel: 'Parts',
    xFormat: (v: number) => String(v),
    yFormat: (v: number) => `${v} h`,
    showTrend: true,
    height: 300,
  },
};

export const Empty: Story = {
  args: { series: [], subtitle: 'No completed jobs in this range' },
};
