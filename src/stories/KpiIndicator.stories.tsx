import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../components/Card/Card';
import { KpiIndicator } from '../components/KpiIndicator/KpiIndicator';

/** Story-only sparkline: data-derived points, token stroke, non-scaling 2px line. */
function Sparkline({ data }: { data: number[] }) {
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - lo) / (hi - lo || 1)) * 28 - 1}`).join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true" style={{ width: 'var(--space-16)', height: 'var(--space-6)', overflow: 'visible' }}>
      <polyline points={pts} vectorEffect="non-scaling-stroke" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 'var(--border-width-2)', strokeLinejoin: 'round', strokeLinecap: 'round' }} />
    </svg>
  );
}

const PRINTS = [18, 22, 19, 25, 24, 28, 31];
const FAILS = [9, 8, 7, 7, 6, 5, 4];

const meta = {
  title: 'Components/Data Display/KpiIndicator',
  component: KpiIndicator,
  tags: ['expanded'],
  args: {
    label: 'Prints completed',
    value: 128,
    unit: 'prints',
    delta: 12,
    deltaLabel: 'vs last week',
    goodDirection: 'up',
    target: 150,
    size: 'md',
  },
  argTypes: {
    goodDirection: { control: 'inline-radio', options: ['up', 'down'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    trend: { control: 'boolean', mapping: { true: <Sparkline data={PRINTS} />, false: undefined } },
    value: { control: 'number' },
    formatValue: { control: false },
    formatDelta: { control: false },
  },
  decorators: [(S) => <Card style={{ width: 'var(--size-layout-sidebar)' }}><S /></Card>],
  parameters: {
    docs: {
      description: {
        component:
          'Compact KPI for fleet dashboards and print history: label, big value, delta chip coloured by `goodDirection` (`--color-status-success-strong` / `--color-status-danger-strong` on their `-soft` fills), optional target line on `--color-chart-track`, and a trend slot (e.g. a sparkline). Flat content; place it in a Card for a surface.',
      },
    },
  },
} satisfies Meta<typeof KpiIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const GoodDirectionDown: Story = {
  name: 'Good direction: down',
  args: { label: 'Failed prints', value: 4, unit: undefined, delta: -33, deltaLabel: 'vs last week', goodDirection: 'down', target: undefined, trend: <Sparkline data={FAILS} /> },
};

export const BadChange: Story = {
  name: 'Decline',
  args: { label: 'Resin used', value: 4.2, unit: 'L', delta: 18, deltaLabel: 'vs last month', goodDirection: 'down', target: undefined },
};

export const NoChange: Story = {
  args: { label: 'Average print time', value: '3 h 12 min', unit: undefined, delta: 0, deltaLabel: 'vs last week', target: undefined },
};

export const TargetReached: Story = {
  args: { label: 'Print hours this month', value: 164, unit: 'h', delta: 9, target: 160, deltaLabel: 'vs October' },
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  decorators: [(S) => <S />],
  render: () => (
    <div className="sb-row" style={{ alignItems: 'stretch' }}>
      <Card style={{ width: 'var(--size-layout-sidebar)' }}>
        <KpiIndicator size="sm" label="Prints completed" value={128} delta={12} deltaLabel="vs last week" target={150} />
      </Card>
      <Card style={{ width: 'var(--size-layout-sidebar)' }}>
        <KpiIndicator size="md" label="Prints completed" value={128} delta={12} deltaLabel="vs last week" target={150} />
      </Card>
    </div>
  ),
};

export const Dashboard: Story = {
  name: 'Fleet dashboard row',
  parameters: { controls: { disable: true } },
  decorators: [(S) => <S />],
  render: () => (
    <div className="sb-row" style={{ alignItems: 'stretch' }}>
      {[
        <KpiIndicator key="a" size="sm" label="Prints completed" value={128} delta={12} deltaLabel="vs last week" trend={<Sparkline data={PRINTS} />} />,
        <KpiIndicator key="b" size="sm" label="Success rate" value={96.8} unit="%" delta={1.4} deltaLabel="vs last week" target={98} />,
        <KpiIndicator key="c" size="sm" label="Failed prints" value={4} delta={-33} goodDirection="down" deltaLabel="vs last week" trend={<Sparkline data={FAILS} />} />,
        <KpiIndicator key="d" size="sm" label="Resin used" value={4.2} unit="L" delta={18} goodDirection="down" deltaLabel="vs last month" />,
      ].map((kpi, i) => (
        <Card key={i} variant="elevated" style={{ width: 'var(--size-layout-sidebar)', flex: 'none' }}>
          {kpi}
        </Card>
      ))}
    </div>
  ),
};
