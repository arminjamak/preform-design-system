import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleAlertIcon, DropletIcon, GaugeIcon, PrinterIcon } from 'lucide-react';
import { StatCard } from '../components/StatCard/StatCard';

/** Story-only sparkline: data-derived geometry, colours from chart tokens. */
function Sparkline({ data, tone = 'var(--color-chart-series-1)' }: { data: number[]; tone?: string }) {
  const w = 64;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - 2 - ((d - min) / (max - min || 1)) * (h - 4)}`).join(' ');
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        width: 'var(--space-16)',
        height: 'var(--space-6)',
        overflow: 'visible',
      }}
    >
      <polyline
        points={points}
        fill="none"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: tone, strokeWidth: 'var(--border-width-2)' }}
      />
    </svg>
  );
}

function Bars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <svg viewBox={`0 0 ${data.length * 6} 24`} aria-hidden="true" style={{ width: 'var(--space-16)', height: 'var(--space-6)' }}>
      {data.map((d, i) => (
        <rect
          key={i}
          x={i * 6}
          y={24 - (d / max) * 24}
          width={4}
          height={(d / max) * 24}
          rx={1}
          style={{
            fill: i === data.length - 1 ? 'var(--color-chart-series-1)' : 'var(--color-chart-track)',
          }}
        />
      ))}
    </svg>
  );
}

const icons = {
  none: undefined,
  printer: <PrinterIcon strokeWidth={2.2} />,
  resin: <DropletIcon strokeWidth={2.2} />,
  failed: <CircleAlertIcon strokeWidth={2.2} />,
  uptime: <GaugeIcon strokeWidth={2.2} />,
};
const trends = {
  none: undefined,
  sparkline: <Sparkline data={[28, 31, 30, 35, 33, 38, 42]} />,
  bars: <Bars data={[6, 4, 7, 5, 8, 5, 7]} />,
};

const meta = {
  title: 'Components/Data Display/StatCard',
  component: StatCard,
  tags: ['expanded'],
  args: {
    label: 'Prints this week',
    value: '42',
    unit: 'prints',
    delta: '12%',
    deltaTone: 'positive',
    footnote: 'vs. 37 last week · 4 printers',
    variant: 'outline',
    icon: icons.printer,
    trend: trends.sparkline,
  },
  argTypes: {
    value: { control: 'text' },
    variant: {
      control: 'inline-radio',
      options: ['outline', 'elevated', 'subtle'],
    },
    deltaTone: {
      control: 'inline-radio',
      options: ['positive', 'negative', 'neutral'],
    },
    deltaDirection: {
      control: 'inline-radio',
      options: [undefined, 'up', 'down', 'flat'],
    },
    footnote: { control: 'text' },
    icon: { control: 'select', options: Object.keys(icons), mapping: icons },
    trend: { control: 'select', options: Object.keys(trends), mapping: trends },
  },
  decorators: [
    (S) => (
      <div style={{ width: 'calc(var(--size-layout-sidebar) + var(--space-8))' }}>
        <S />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Metric tile for the fleet dashboard and print reports: label, headline value with unit, a delta chip whose tone (success / danger Badge) is independent of its arrow, an optional icon, footnote and trend slot. Built on `Card`, so `outline | elevated | subtle` match every other surface. Value uses the heading type token; the trend slot inherits `--color-chart-series-1`.',
      },
    },
  },
} satisfies Meta<typeof StatCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  decorators: [],
  render: (args) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, var(--size-layout-sidebar))',
        gap: 'var(--space-3)',
      }}
    >
      <StatCard {...args} variant="outline" footnote="outline" />
      <StatCard {...args} variant="elevated" footnote="elevated" />
      <StatCard {...args} variant="subtle" footnote="subtle" />
    </div>
  ),
};

export const DeltaTones: Story = {
  name: 'Delta tones',
  decorators: [],
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, var(--size-layout-sidebar))',
        gap: 'var(--space-3)',
      }}
    >
      <StatCard label="Resin used" value="1.8" unit="L" delta="6%" deltaTone="neutral" deltaDirection="up" icon={icons.resin} footnote="Grey V5 · Clear V5 · Tough 2000" />
      <StatCard
        label="Failed prints"
        value="3"
        delta="2"
        deltaTone="positive"
        deltaDirection="down"
        deltaLabel="Down 2 from last week"
        icon={icons.failed}
        footnote="Fewer failures is good: positive tone, down arrow"
      />
      <StatCard
        label="Printer uptime"
        value="96.4"
        unit="%"
        delta="1.2 pts"
        deltaTone="negative"
        icon={icons.uptime}
        footnote="Form 4 #2 offline for tank swap"
        trend={<Sparkline data={[99, 98, 99, 97, 98, 95, 96]} tone="var(--color-status-danger)" />}
      />
      <StatCard label="Average print time" value="3 h 48 min" delta="0%" deltaTone="neutral" deltaDirection="flat" footnote="50 µm layers, Default (Fast)" />
    </div>
  ),
};

export const Dashboard: Story = {
  decorators: [],
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, var(--size-field-lg)))',
        gap: 'var(--space-3)',
      }}
    >
      <StatCard variant="elevated" label="Prints this week" value="42" delta="12%" icon={icons.printer} trend={trends.bars} />
      <StatCard variant="elevated" label="Resin used" value="1.8" unit="L" delta="6%" deltaTone="neutral" deltaDirection="up" icon={icons.resin} />
      <StatCard variant="elevated" label="Failed prints" value="3" delta="2" deltaTone="positive" deltaDirection="down" icon={icons.failed} />
      <StatCard variant="elevated" label="Uptime" value="96.4" unit="%" delta="1.2" deltaTone="negative" icon={icons.uptime} />
    </div>
  ),
};

export const Minimal: Story = {
  args: {
    icon: undefined,
    trend: undefined,
    footnote: undefined,
    delta: undefined,
    unit: undefined,
    label: 'Models on platform',
    value: '7',
  },
};
