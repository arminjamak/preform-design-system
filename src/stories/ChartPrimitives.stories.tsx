import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ChartFrame } from '../components/Chart/ChartFrame';
import { ChartTooltip } from '../components/Chart/ChartTooltip';
import { Legend, type LegendItem } from '../components/Chart/Legend';
import { seriesColor } from '../components/Chart/scales';

const materials: LegendItem[] = [
  { id: 'grey-v5', label: 'Grey V5' },
  { id: 'clear-v5', label: 'Clear V5' },
  { id: 'tough-2000', label: 'Tough 2000' },
  { id: 'draft-v2', label: 'Draft V2' },
  { id: 'flexible-80a', label: 'Flexible 80A' },
  { id: 'other', label: 'Other resins' },
];

const withShares: LegendItem[] = materials.map((m, i) => ({ ...m, value: ['41%', '25%', '15%', '11%', '5%', '3%'][i] }));

const printers: LegendItem[] = [
  { id: 'form-4', label: 'Form 4' },
  { id: 'form-4l', label: 'Form 4L' },
  { id: 'fuse', label: 'Fuse 1+ 30W' },
];

const meta = {
  title: 'Components/Charts/Legend & Tooltip',
  component: Legend,
  tags: ['expanded'],
  args: {
    items: materials,
    marker: 'square',
    orientation: 'horizontal',
  },
  argTypes: {
    items: { control: 'object' },
    marker: { control: 'inline-radio', options: ['square', 'line', 'dot'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    hidden: { control: 'object' },
    onToggle: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Shared chart primitives from `src/components/Chart`, used by every chart so they read as one system. `Legend` explains series colours (`--color-chart-series-1…6`, blue first) with a square, line or dot marker, optional values, and becomes a row of toggle buttons (`aria-pressed`) when `onToggle` is passed. `ChartTooltip` is the floating value readout anchored above a mark on hover or keyboard focus; it needs a `position: relative` plot container.',
      },
    },
  },
} satisfies Meta<typeof Legend>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Markers: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="sb-matrix">
      <tbody>
        <tr>
          <th className="pf-text-caption">square · bars, areas</th>
          <td>
            <Legend items={materials.slice(0, 4)} marker="square" />
          </td>
        </tr>
        <tr>
          <th className="pf-text-caption">line · line series</th>
          <td>
            <Legend items={printers} marker="line" />
          </td>
        </tr>
        <tr>
          <th className="pf-text-caption">dot · scatter, map</th>
          <td>
            <Legend items={printers} marker="dot" />
          </td>
        </tr>
      </tbody>
    </table>
  ),
};

export const VerticalWithValues: Story = {
  args: { items: withShares, orientation: 'vertical' },
};

export const Interactive: Story = {
  args: { items: printers, marker: 'line' },
  render: function Render(args) {
    const [hidden, setHidden] = useState<string[]>(['fuse']);
    return (
      <div className="sb-stack">
        <Legend {...args} hidden={hidden} onToggle={(id) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]))} />
        <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-secondary)' }}>
          Hidden: {hidden.length ? hidden.join(', ') : 'none'} · click an item to toggle its series
        </span>
      </div>
    );
  },
};

export const Tooltip: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ position: 'relative', width: 'var(--size-layout-panel)', height: 'calc(var(--space-24) + var(--space-8))' }}>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 0,
          width: 'var(--space-6)',
          height: 'var(--space-8)',
          marginLeft: 'calc(var(--space-3) * -1)',
          borderRadius: 'var(--radius-xs)',
          background: 'var(--color-chart-series-1)',
        }}
      />
      <ChartTooltip
        x={150}
        y={96}
        title="Tue · 14:00"
        rows={[
          { label: 'Form 4', value: '86%' },
          { label: 'Form 4L', value: '72%' },
          { label: 'Fuse 1+ 30W', value: '41%' },
        ]}
      />
    </div>
  ),
};

/** Frame, marks, interactive legend and tooltip composed together, the way each chart component uses them. */
export const Composed: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const data = [
      { id: 'form-4', label: 'Form 4', value: 86 },
      { id: 'form-4l', label: 'Form 4L', value: 72 },
      { id: 'fuse', label: 'Fuse 1+ 30W', value: 41 },
    ];
    const [hidden, setHidden] = useState<string[]>([]);
    const [active, setActive] = useState<number | null>(null);
    const W = 300;
    const H = 120;
    const bw = 48;
    const step = W / data.length;
    return (
      <div style={{ width: 'var(--size-layout-dialog-sm)' }}>
        <ChartFrame
          title="Utilisation today"
          subtitle="Average across the Somerville fleet"
          legend={
            <Legend
              items={data.map((d, i) => ({ id: d.id, label: d.label, color: seriesColor(i) }))}
              hidden={hidden}
              onToggle={(id) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]))}
            />
          }
        >
          <div style={{ position: 'relative' }} onPointerLeave={() => setActive(null)}>
            <svg width={W} height={H} role="img" aria-label="Utilisation today: Form 4 86%, Form 4L 72%, Fuse 1+ 30W 41%" style={{ display: 'block', overflow: 'visible' }}>
              {data.map((d, i) =>
                hidden.includes(d.id) ? null : (
                  <rect
                    key={d.id}
                    x={i * step + (step - bw) / 2}
                    y={H - (d.value / 100) * H}
                    width={bw}
                    height={(d.value / 100) * H}
                    rx={2}
                    style={{ fill: seriesColor(i), opacity: active !== null && active !== i ? 'var(--opacity-dimmed)' : undefined }}
                    onPointerEnter={() => setActive(i)}
                  />
                ),
              )}
            </svg>
            {active !== null && !hidden.includes(data[active].id) && (
              <ChartTooltip
                x={active * step + step / 2}
                y={H - (data[active].value / 100) * H}
                title={data[active].label}
                rows={[{ label: 'Utilisation', value: `${data[active].value}%`, color: seriesColor(active) }]}
              />
            )}
          </div>
        </ChartFrame>
      </div>
    );
  },
};
