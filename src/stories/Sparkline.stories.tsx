import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkline, type SparklineProps } from '../components/Sparkline/Sparkline';
import { Card } from '../components/Card/Card';

const weeks = ['W27', 'W28', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34', 'W35', 'W36', 'W37', 'W38'];
const printsPerWeek = [64, 71, 58, 77, 87, 92, 84, 96, 99, 94, 100, 110];
const failures = [6, 5, 7, 4, 5, 3, 4, 3, 2, 3, 2, 2];
const resinLeft = [1000, 920, 860, 790, 700, 640, 560, 470, 410, 330, 260, 190];
const utilisation = [72, 68, 75, 81, 79, 83, 77, 85, 88, 84, 90, 86];
const netChange = [4, 7, -13, 19, 10, 5, -8, 12, 3, -5, 6, 10];

const meta = {
  title: 'Components/Charts/Sparkline',
  component: Sparkline,
  tags: ['expanded'],
  args: {
    data: printsPerWeek,
    labels: weeks,
    variant: 'line',
    tone: 'accent',
    height: 28,
    width: 160,
    showMinMax: false,
    interactive: true,
    ariaLabel: 'Prints per week, last 12 weeks',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['line', 'area', 'bar'] },
    tone: { control: 'inline-radio', options: ['accent', 'success', 'danger', 'neutral'] },
    height: { control: { type: 'range', min: 20, max: 48, step: 2 } },
    width: { control: { type: 'range', min: 64, max: 320, step: 8 } },
    showMinMax: { control: 'boolean' },
    interactive: { control: 'boolean' },
    data: { control: 'object' },
    valueFormat: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Axis-free trend for StatCards in the PreForm fleet dashboard: prints per week, failures, resin left. The last value is emphasised; tone maps to --color-chart-series-1, --color-status-success, --color-status-danger or --color-chart-series-6.',
      },
    },
  },
} satisfies Meta<typeof Sparkline>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="sb-stack">
      {(['line', 'area', 'bar'] as const).map((v) => (
        <div key={v} className="sb-row">
          <span className="pf-text-label-sm" style={{ width: 'var(--space-12)' }}>
            {v}
          </span>
          <Sparkline {...args} variant={v} />
        </div>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const rows: Array<{ tone: SparklineProps['tone']; data: number[]; label: string }> = [
      { tone: 'accent', data: printsPerWeek, label: 'Prints per week' },
      { tone: 'success', data: utilisation, label: 'Fleet utilisation (%)' },
      { tone: 'danger', data: failures, label: 'Failed prints' },
      { tone: 'neutral', data: resinLeft, label: 'Grey V5 left (mL)' },
    ];
    return (
      <div className="sb-stack">
        {rows.map((r) => (
          <div key={r.label} className="sb-row">
            <span className="pf-text-label-sm" style={{ width: 'var(--space-24)' }}>
              {r.tone}
            </span>
            <Sparkline {...args} data={r.data} tone={r.tone} variant="area" showMinMax ariaLabel={r.label} />
          </div>
        ))}
      </div>
    );
  },
};

export const NegativeBars: Story = {
  args: { data: netChange, variant: 'bar', tone: 'neutral', showMinMax: true, ariaLabel: 'Week-over-week change in completed prints' },
};

/** How the sparkline sits inside a StatCard: fills the card width at 32 units tall. */
export const InStatCards: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const cards: Array<{ label: string; value: string; delta: string; spark: SparklineProps }> = [
      { label: 'Prints this week', value: '110', delta: '+10% vs last week', spark: { data: printsPerWeek, tone: 'accent', variant: 'area', labels: weeks } },
      { label: 'Failed prints', value: '2', delta: '−1 vs last week', spark: { data: failures, tone: 'success', variant: 'line', labels: weeks, showMinMax: true } },
      { label: 'Grey Resin V5 left', value: '190 mL', delta: 'Reorder soon', spark: { data: resinLeft, tone: 'danger', variant: 'bar', labels: weeks } },
    ];
    return (
      <div className="sb-row" style={{ alignItems: 'stretch' }}>
        {cards.map((c) => (
          <Card key={c.label} variant="elevated" padding="md" style={{ width: 'var(--size-layout-sidebar)' }}>
            <div className="sb-stack" style={{ gap: 'var(--space-1)', alignItems: 'stretch' }}>
              <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>
                {c.label}
              </span>
              <span className="pf-text-title">{c.value}</span>
              <Sparkline {...c.spark} height={32} ariaLabel={`${c.label}, last 12 weeks`} />
              <span className="pf-text-caption" style={{ color: 'var(--color-fg-muted)' }}>
                {c.delta}
              </span>
            </div>
          </Card>
        ))}
      </div>
    );
  },
};

export const Empty: Story = { args: { data: [], ariaLabel: 'No prints yet' } };
