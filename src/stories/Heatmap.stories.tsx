import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heatmap } from '../components/Heatmap/Heatmap';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));

/** Deterministic utilisation (%): busy office hours, long overnight jobs, quieter weekends. */
function utilisation(day: number, hour: number): number {
  const weekend = day >= 5;
  const office = hour >= 8 && hour <= 18 ? 1 : 0;
  const overnight = hour >= 19 || hour <= 5 ? 1 : 0;
  const base = weekend ? 18 + overnight * 14 : 34 + office * 46 + overnight * 22;
  const ripple = Math.sin(day * 1.7 + hour * 0.9) * 7 + Math.cos(hour * 0.45 + day) * 5;
  return Math.max(0, Math.min(100, Math.round(base + ripple)));
}
const fleetUtilisation = weekdays.map((_, d) => hours.map((__, h) => utilisation(d, h)));

const percent = (v: number) => `${Math.round(v)}%`;

const materials = ['Grey V5', 'Clear V5', 'Tough 2000', 'Draft V2', 'Flexible 80A'];
const printers = ['Form 4 · A1', 'Form 4 · A2', 'Form 4L · B1', 'Form 3+ · C1'];
const failureRate: Array<Array<number | null>> = [
  [1.2, 2.4, 3.1, 0.8, 6.2],
  [1.4, 2.1, 2.8, 1.1, null],
  [2.2, 3.6, 4.9, 1.9, 8.4],
  [3.8, 5.2, 6.1, 2.6, 11.3],
];

const meta = {
  title: 'Components/Charts/Heatmap',
  component: Heatmap,
  tags: ['expanded'],
  args: {
    title: 'Printer utilisation',
    subtitle: 'Fleet average by weekday and hour · last 4 weeks',
    xLabels: hours,
    yLabels: weekdays,
    values: fleetUtilisation,
    showValues: false,
    cellGap: 2,
    cellHeight: 24,
    showScale: true,
    scaleLabel: 'Utilisation',
    valueFormat: percent,
    domain: [0, 100],
  },
  argTypes: {
    xLabels: { control: 'object' },
    yLabels: { control: 'object' },
    values: { control: 'object' },
    domain: { control: 'object' },
    cellGap: { control: { type: 'range', min: 0, max: 6, step: 1 } },
    cellHeight: { control: { type: 'range', min: 16, max: 40, step: 4 } },
    valueFormat: { control: false },
  },
  decorators: [
    (S) => (
      <div style={{ width: 'calc(var(--size-layout-dialog-lg) * 1.4)', maxWidth: '100%' }}>
        <S />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Matrix of cells coloured on the sequential ramp (`sequentialColor(t)`, mixing `--color-chart-sequential-low` → `--color-chart-sequential-high`), e.g. printer utilisation by weekday × hour in the PreForm Dashboard. The scale bar below is the legend and marks the hovered value. Arrow keys move between cells (Ctrl+Home/End jump to the corners).',
      },
    },
  },
} satisfies Meta<typeof Heatmap>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithValues: Story = {
  args: {
    title: 'Print failure rate',
    subtitle: 'Failed prints per 100 jobs, by printer and material',
    xLabels: materials,
    yLabels: printers,
    values: failureRate,
    showValues: true,
    cellHeight: 32,
    domain: undefined,
    scaleLabel: 'Failure rate',
    valueFormat: (v: number) => `${v.toFixed(1)}%`,
  },
};

export const OfficeHoursWithValues: Story = {
  args: {
    subtitle: 'Weekday office hours only',
    xLabels: hours.slice(8, 19),
    yLabels: weekdays.slice(0, 5),
    values: fleetUtilisation.slice(0, 5).map((r) => r.slice(8, 19)),
    showValues: true,
    cellHeight: 28,
  },
};

export const NoGap: Story = {
  args: { cellGap: 0, cellHeight: 20 },
};

export const Empty: Story = {
  args: { values: [], subtitle: 'No printers reported in this period' },
};
