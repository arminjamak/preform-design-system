import type { Meta, StoryObj } from '@storybook/react-vite';
import { MapChart, type MapPoint } from '../components/MapChart/MapChart';

const printFarms: MapPoint[] = [
  { id: 'somerville', label: 'Somerville, MA', lat: 42.39, lon: -71.1, value: 64, series: 'Form 4' },
  { id: 'austin', label: 'Austin, TX', lat: 30.27, lon: -97.74, value: 28, series: 'Form 4' },
  { id: 'toronto', label: 'Toronto', lat: 43.65, lon: -79.38, value: 14, series: 'Form 4L' },
  { id: 'mexico-city', label: 'Mexico City', lat: 19.43, lon: -99.13, value: 9, series: 'Form 4' },
  { id: 'sao-paulo', label: 'São Paulo', lat: -23.55, lon: -46.63, value: 12, series: 'Form 4L' },
  { id: 'berlin', label: 'Berlin', lat: 52.52, lon: 13.4, value: 38, series: 'Fuse 1+ 30W' },
  { id: 'budapest', label: 'Budapest', lat: 47.5, lon: 19.04, value: 18, series: 'Form 4' },
  { id: 'cape-town', label: 'Cape Town', lat: -33.92, lon: 18.42, value: 6, series: 'Form 4' },
  { id: 'bangalore', label: 'Bengaluru', lat: 12.97, lon: 77.59, value: 15, series: 'Form 4L' },
  { id: 'singapore', label: 'Singapore', lat: 1.35, lon: 103.82, value: 20, series: 'Fuse 1+ 30W' },
  { id: 'tokyo', label: 'Tokyo', lat: 35.68, lon: 139.69, value: 24, series: 'Form 4' },
  { id: 'sydney', label: 'Sydney', lat: -33.87, lon: 151.21, value: 16, series: 'Form 4L' },
];

const meta = {
  title: 'Components/Charts/MapChart',
  component: MapChart,
  tags: ['expanded'],
  args: {
    title: 'Print farm locations',
    subtitle: 'Active printers per site, by printer family',
    points: printFarms,
    showGraticule: true,
    showList: false,
    listTitle: 'Sites',
    valueLabel: 'Printers',
  },
  argTypes: {
    points: { control: 'object' },
    valueFormat: { control: false },
  },
  decorators: [
    (S) => (
      <div style={{ width: 'calc(var(--size-layout-dialog-lg) * 1.5)', maxWidth: '100%' }}>
        <S />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Schematic map, not geographically accurate.** A dependency-free location view for things like print farm sites: an equirectangular projection with a 30° graticule (`--color-chart-grid`) and a dotted landmass generated from a few coarse, hand-simplified continent polygons (`--color-border-default`). Points are circles sized by value (area ∝ value) and coloured by series (`--color-chart-series-*`). Use it to show roughly *where* things are; never for borders, distances or anything that needs real geography. Arrow keys step through points west → east.',
      },
    },
  },
} satisfies Meta<typeof MapChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithRegionList: Story = {
  args: { showList: true },
};

export const SingleSeries: Story = {
  args: {
    title: 'Open support tickets',
    subtitle: 'By customer site',
    points: printFarms.map(({ series: _series, ...p }) => ({ ...p, value: Math.round(p.value / 3) + 1 })),
    valueLabel: 'Tickets',
    showList: true,
    listTitle: 'Sites',
  },
};

export const NoGraticule: Story = {
  args: { showGraticule: false },
};

export const Empty: Story = {
  args: { points: [], subtitle: 'No printers registered to this organisation' },
};
