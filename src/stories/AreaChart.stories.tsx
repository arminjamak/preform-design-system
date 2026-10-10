import type { Meta, StoryObj } from '@storybook/react-vite';
import { AreaChart } from '../components/AreaChart/AreaChart';
import type { LineDatum } from '../components/LineChart/LineChart';
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

const queueHours: LineDatum[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({
  x: d,
  values: { queued: [14, 22, 19, 27, 31, 9, 6][i] },
}));

const mL = (v: number) => `${formatNumber(v)} mL`;

const meta = {
  title: 'Components/Charts/AreaChart',
  component: AreaChart,
  tags: ['expanded'],
  args: {
    title: 'Resin consumption',
    subtitle: 'Millilitres per month by material',
    data: resinByMonth,
    series: materials,
    stacked: false,
    curve: 'monotone',
    showPoints: false,
    height: 240,
    valueFormat: mL,
  },
  argTypes: {
    stacked: { control: 'boolean' },
    curve: { control: 'inline-radio', options: ['linear', 'monotone'] },
    showPoints: { control: 'boolean' },
    showLegend: { control: 'boolean' },
    height: { control: { type: 'range', min: 120, max: 400, step: 8 } },
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
          'LineChart with the area fill on by default. Overlapping areas fade each --color-chart-series-* token to transparent; `stacked` shows how materials add up to total resin use with flat translucent bands.',
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
} satisfies Meta<typeof AreaChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Stacked: Story = {
  args: { stacked: true, title: 'Total resin consumption', subtitle: 'Stacked by material (mL)' },
};

export const SingleSeries: Story = {
  args: {
    title: 'Queued print hours',
    subtitle: 'Hours of jobs waiting, this week',
    data: queueHours,
    series: [{ id: 'queued', label: 'Queued hours' }],
    valueFormat: (v: number) => `${v} h`,
    showPoints: true,
    showLegend: false,
    height: 180,
  },
};

export const Empty: Story = {
  args: { data: [], subtitle: 'No resin cartridges registered yet' },
};
