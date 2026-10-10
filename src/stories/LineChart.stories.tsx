import type { Meta, StoryObj } from '@storybook/react-vite';
import { LineChart, type LineDatum } from '../components/LineChart/LineChart';
import { formatNumber } from '../components/Chart/scales';

const materials = [
  { id: 'grey', label: 'Grey Resin V5' },
  { id: 'clear', label: 'Clear Resin V5' },
  { id: 'tough', label: 'Tough 2000' },
  { id: 'rigid', label: 'Rigid 10K' },
];

const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
const grey = [980, 1040, 860, 1120, 1260, 1190, 1340, 1410, 1180, 1290, 1460, 1530];
const clear = [620, 700, 540, 760, 810, 880, 840, 920, 790, 860, 950, 1010];
const tough = [410, 380, 450, 520, 490, 610, 640, 580, 700, 660, 720, 760];
const rigid = [180, 220, 160, 240, 310, 280, 260, 330, 300, 350, 320, 380];

const resinByMonth: LineDatum[] = months.map((m, i) => ({ x: m, values: { grey: grey[i], clear: clear[i], tough: tough[i], rigid: rigid[i] } }));

const printsPerWeek: LineDatum[] = [
  [42, 18, 27],
  [47, 21, 24],
  [39, 16, 29],
  [51, 23, 22],
  [55, 19, 25],
  [48, 26, 20],
  [58, 24, 18],
  [61, 28, 21],
].map(([a, b, c], i) => ({ x: `W${31 + i}`, values: { form4: a, form4l: b, form3plus: c } }));

const printers = [
  { id: 'form4', label: 'Form 4' },
  { id: 'form4l', label: 'Form 4L' },
  { id: 'form3plus', label: 'Form 3+' },
];

/** Form 3+ was offline for maintenance in W34–W35: gaps instead of zeros. */
const withGaps: LineDatum[] = printsPerWeek.map((d, i) => (i === 3 || i === 4 ? { ...d, values: { ...d.values, form3plus: null } } : d));

const failureByLayer: LineDatum[] = [
  { x: 0.025, values: { form4: 4.8, form3plus: 7.2 } },
  { x: 0.05, values: { form4: 2.9, form3plus: 4.6 } },
  { x: 0.1, values: { form4: 1.8, form3plus: 3.1 } },
  { x: 0.16, values: { form4: 1.5, form3plus: 2.7 } },
  { x: 0.2, values: { form4: 2.1, form3plus: 3.4 } },
  { x: 0.3, values: { form4: 3.6, form3plus: 5.9 } },
];

const mL = (v: number) => `${formatNumber(v)} mL`;

const meta = {
  title: 'Components/Charts/LineChart',
  component: LineChart,
  tags: ['expanded'],
  args: {
    title: 'Resin consumption',
    subtitle: 'Millilitres per month by material',
    data: resinByMonth,
    series: materials,
    curve: 'monotone',
    showPoints: false,
    area: false,
    height: 240,
    valueFormat: mL,
  },
  argTypes: {
    curve: { control: 'inline-radio', options: ['linear', 'monotone'] },
    showPoints: { control: 'boolean' },
    area: { control: 'boolean' },
    stacked: { control: 'boolean' },
    includeZero: { control: 'boolean' },
    showLegend: { control: 'boolean' },
    height: { control: { type: 'range', min: 120, max: 400, step: 8 } },
    yDomain: { control: 'object' },
    data: { control: 'object' },
    series: { control: 'object' },
    valueFormat: { control: false },
    xFormat: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Trends over time for the PreForm dashboard: resin consumption, prints per week. Hover or arrow keys move a crosshair that reads out every series. Lines use --color-chart-series-*, area gradients fade the same token to transparent.',
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
} satisfies Meta<typeof LineChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithArea: Story = {
  args: { area: true, series: materials.slice(0, 2), title: 'Grey vs Clear', subtitle: 'Resin used per month (mL)' },
};

export const LinearWithPoints: Story = {
  args: {
    title: 'Prints per week',
    subtitle: 'Completed jobs by printer',
    data: printsPerWeek,
    series: printers,
    curve: 'linear',
    showPoints: true,
    valueFormat: undefined,
  },
};

export const MissingData: Story = {
  args: {
    title: 'Prints per week',
    subtitle: 'Form 3+ offline for maintenance in W34–W35',
    data: withGaps,
    series: printers,
    showPoints: true,
    valueFormat: undefined,
  },
};

export const NumericX: Story = {
  args: {
    title: 'Failure rate vs layer height',
    subtitle: 'Share of failed prints (%) by layer height (mm)',
    data: failureByLayer,
    series: [printers[0], printers[2]],
    showPoints: true,
    valueFormat: (v: number) => `${v}%`,
    xFormat: (x: string | number) => `${x} mm`,
  },
};

export const Compact: Story = {
  args: { height: 160, title: 'Grey Resin V5', subtitle: undefined, series: [materials[0]], area: true, showLegend: false },
};

export const Empty: Story = {
  args: { data: [], subtitle: 'No resin cartridges registered yet' },
};
