import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { BoxIcon } from 'lucide-react';
import { ScrollArea } from '../components/ScrollArea/ScrollArea';
import { Card } from '../components/Card/Card';
import { ListItem } from '../components/ListItem/ListItem';
import { StateMatrix } from './helpers/StateMatrix';

const iconStyle = { width: 'var(--size-icon-xs)', height: 'var(--size-icon-xs)' };

const MODELS = [
  'Dental_Arch_Upper', 'Dental_Arch_Lower', 'Bracket_v3', 'Turbine_Blade', 'Hinge_Clip_x4', 'Gear_Housing', 'Ring_Prototype',
  'Drone_Arm_L', 'Drone_Arm_R', 'Calibration_Cube', 'Phone_Stand', 'Cable_Clip', 'Lens_Mount', 'Knob_Ribbed', 'Spacer_8mm',
];

const MATERIALS = [
  { name: 'Grey V5', tone: 'var(--color-chart-series-6)' },
  { name: 'Clear V5', tone: 'var(--color-chart-series-1)' },
  { name: 'Tough 2000', tone: 'var(--color-chart-series-2)' },
  { name: 'Durable', tone: 'var(--color-chart-series-3)' },
  { name: 'Rigid 10K', tone: 'var(--color-chart-series-4)' },
  { name: 'Castable Wax', tone: 'var(--color-chart-series-5)' },
  { name: 'Model V3', tone: 'var(--color-accent-tone-blue)' },
  { name: 'Elastic 50A', tone: 'var(--color-accent-tone-magenta)' },
];

function ModelList() {
  const [selected, setSelected] = useState(MODELS[2]);
  return (
    <div style={{ padding: 'var(--space-1)' }}>
      {MODELS.map((m) => (
        <ListItem key={m} label={`${m}.stl`} selected={m === selected} onClick={() => setSelected(m)} leading={<BoxIcon strokeWidth={2.2} style={iconStyle} />} />
      ))}
    </div>
  );
}

const panel = {
  width: 'var(--size-layout-panel)',
  background: 'var(--color-bg-surface)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--elevation-panel), 0 0 0 var(--border-width-1) var(--color-border-subtle)',
};

const meta = {
  title: 'Components/Layout/ScrollArea',
  component: ScrollArea,
  tags: ['expanded'],
  args: { direction: 'vertical', maxHeight: 'var(--size-layout-sidebar)', fade: true, label: 'Models on build plate' },
  argTypes: {
    direction: { control: 'inline-radio', options: ['vertical', 'horizontal', 'both'] },
    maxHeight: { control: 'select', options: [undefined, 'var(--size-layout-menu-min)', 'var(--size-layout-sidebar)', 'var(--size-layout-panel)', 'calc(var(--size-layout-panel) * 1.5)'] },
    children: { control: false },
    'data-state': { control: 'inline-radio', options: [undefined, 'focus'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Scroll container with thin scrollbars coloured by `--color-border-default` / `--color-border-strong` (standard `scrollbar-color` plus WebKit pseudo-elements). Edges fade out with a mask only where more content is hidden, so it works on any surface in both themes. The viewport is focusable for keyboard scrolling.',
      },
    },
  },
  render: (args) => (
    <div style={panel}>
      <ScrollArea {...args}>
        <ModelList />
      </ScrollArea>
    </div>
  ),
} satisfies Meta<typeof ScrollArea>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Horizontal: Story = {
  args: { direction: 'horizontal', maxHeight: undefined, label: 'Materials' },
  render: (args) => (
    <div style={{ ...panel, padding: 'var(--space-2) 0' }}>
      <ScrollArea {...args}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', padding: '0 var(--space-2) var(--space-2)' }}>
          {MATERIALS.map((m) => (
            <Card key={m.name} padding="sm" interactive style={{ width: 'var(--size-field-md)', flex: 'none' }}>
              <span style={{ display: 'block', height: 'var(--size-control-lg)', borderRadius: 'var(--radius-sm)', background: m.tone, marginBottom: 'var(--space-1)' }} />
              <span className="pf-text-label">{m.name}</span>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

export const BothAxes: Story = {
  name: 'Both axes',
  args: { direction: 'both', maxHeight: 'var(--size-layout-menu-min)', label: 'Layer report' },
  render: (args) => (
    <div style={panel}>
      <ScrollArea {...args}>
        <table className="pf-text-body-sm" style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              {['Layer', 'Height', 'Exposure', 'Area', 'Peel force', 'Models', 'Supports', 'Status'].map((h) => (
                <th key={h} className="pf-text-caption" style={{ textAlign: 'left', padding: 'var(--space-1) var(--space-3)', color: 'var(--color-fg-muted)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 16 }, (_, i) => (
              <tr key={i} style={{ borderTop: 'var(--border-width-1) solid var(--color-border-subtle)' }}>
                {[`${i + 1}`, `${((i + 1) * 0.1).toFixed(1)} mm`, '8.2 s', `${(312 + i * 7).toLocaleString()} mm²`, `${(4.1 + i * 0.12).toFixed(2)} N`, '6', i < 4 ? 'Raft' : 'Columns', 'OK'].map((c, j) => (
                  <td key={j} style={{ padding: 'var(--space-1) var(--space-3)' }}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  ),
};

export const WithoutFade: Story = { args: { fade: false } };

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={() => null}
      rows={[
        {
          label: 'vertical',
          render: (p) =>
            p.disabled ? null : (
              <div style={{ ...panel, width: 'var(--size-field-lg)' }}>
                <ScrollArea maxHeight="var(--size-field-md)" label="Models" data-state={p['data-state']}>
                  <ModelList />
                </ScrollArea>
              </div>
            ),
        },
      ]}
    />
  ),
};
