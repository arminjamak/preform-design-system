import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { BoxIcon, EyeIcon } from 'lucide-react';
import { ResizablePanel, SplitPane, type SplitPaneProps } from '../components/SplitPane/SplitPane';
import { Badge } from '../components/Badge/Badge';
import { KeyValueList } from '../components/KeyValueList/KeyValueList';
import { ListItem } from '../components/ListItem/ListItem';
import { StateMatrix } from './helpers/StateMatrix';

const iconStyle = { width: 'var(--size-icon-xs)', height: 'var(--size-icon-xs)' };
const MODELS = ['Dental_Arch_Upper', 'Bracket_v3', 'Turbine_Blade', 'Hinge_Clip_x4', 'Gear_Housing', 'Ring_Prototype', 'Drone_Arm_L', 'Calibration_Cube'];

function ModelList() {
  const [selected, setSelected] = useState(MODELS[0]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-surface)' }}>
      <div className="pf-text-body-strong" style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 'var(--font-weight-bold)' }}>Models (8)</div>
      <div style={{ padding: '0 var(--space-1) var(--space-2)' }}>
        {MODELS.map((m) => (
          <ListItem key={m} label={m} selected={m === selected} onClick={() => setSelected(m)} leading={<BoxIcon strokeWidth={2.2} style={iconStyle} />} trailing={<EyeIcon strokeWidth={2.2} style={iconStyle} />} />
        ))}
      </div>
    </div>
  );
}

function Viewport({ label = 'Build plate · Form 4' }: { label?: string }) {
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        minHeight: 'var(--size-control-xl)',
        background: 'var(--color-bg-canvas)',
        backgroundImage: 'linear-gradient(var(--color-chart-grid) var(--space-px), transparent var(--space-px)), linear-gradient(90deg, var(--color-chart-grid) var(--space-px), transparent var(--space-px))',
        backgroundSize: 'var(--space-6) var(--space-6)',
      }}
    >
      <span className="pf-text-label" style={{ position: 'absolute', top: 'var(--space-2)', left: 'var(--space-2)', color: 'var(--color-fg-muted)' }}>{label}</span>
    </div>
  );
}

function Properties() {
  return (
    <div style={{ padding: 'var(--space-2) var(--space-3)', height: '100%', background: 'var(--color-bg-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <span className="pf-text-body-strong">Dental_Arch_Upper</span>
        <Badge tone="success" variant="soft">Supported</Badge>
      </div>
      <KeyValueList rows={[{ key: 'Dimensions', value: '12.4 × 8.1 × 2.2 cm' }, { key: 'Volume', value: '9.82 mL' }, { key: 'Touchpoints', value: '412' }]} />
    </div>
  );
}

const frame = {
  width: '100%',
  height: 'calc(var(--size-layout-panel) * 1.4)',
  overflow: 'hidden',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--elevation-panel), 0 0 0 var(--border-width-1) var(--color-border-subtle)',
};

const meta = {
  title: 'Components/Layout/SplitPane',
  component: SplitPane,
  tags: ['expanded'],
  args: {
    first: null,
    second: null,
    direction: 'horizontal',
    value: 0.3,
    min: 0.15,
    max: 0.6,
    step: 0.05,
    collapsible: 'first',
    separatorLabel: 'Resize model list',
    firstLabel: 'Model list',
    secondLabel: 'Build plate',
    disabled: false,
    onResize: fn(),
  },
  argTypes: {
    direction: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    collapsible: { control: 'inline-radio', options: [undefined, 'first', 'second'] },
    value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    min: { control: { type: 'range', min: 0, max: 0.5, step: 0.05 } },
    max: { control: { type: 'range', min: 0.5, max: 1, step: 0.05 } },
    step: { control: { type: 'number', min: 0.01, max: 0.25, step: 0.01 } },
    first: { control: false },
    second: { control: false },
    defaultValue: { control: false },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Two panes split by a hairline separator with a grip. Drag it, or focus it and use the arrow keys (Shift for bigger steps), Home/End for the bounds and Enter to collapse the collapsible pane. `value` is the first pane fraction; the separator exposes it as `aria-valuenow` (percent). `ResizablePanel` is a single panel with a handle on one edge.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs<SplitPaneProps>();
    return (
      <div style={frame}>
        <SplitPane
          {...args}
          value={value}
          onResize={(v) => {
            update({ value: v });
            args.onResize?.(v);
          }}
          first={args.direction === 'vertical' ? <Viewport /> : <ModelList />}
          second={args.direction === 'vertical' ? <Properties /> : <Viewport />}
        />
      </div>
    );
  },
} satisfies Meta<typeof SplitPane>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Vertical: Story = {
  args: { direction: 'vertical', value: 0.65, min: 0.3, max: 0.85, collapsible: 'second', separatorLabel: 'Resize properties', firstLabel: 'Build plate', secondLabel: 'Model properties' },
};

export const Nested: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [outer, setOuter] = useState(0.28);
    const [inner, setInner] = useState(0.7);
    return (
      <div style={frame}>
        <SplitPane
          value={outer}
          onResize={setOuter}
          collapsible="first"
          separatorLabel="Resize model list"
          first={<ModelList />}
          second={
            <SplitPane
              direction="vertical"
              value={inner}
              onResize={setInner}
              min={0.4}
              max={0.85}
              separatorLabel="Resize properties"
              first={<Viewport />}
              second={<Properties />}
            />
          }
        />
      </div>
    );
  },
};

export const Resizable: Story = {
  name: 'ResizablePanel',
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [size, setSize] = useState<number | undefined>(undefined);
    return (
      <div style={{ ...frame, display: 'flex' }}>
        <ResizablePanel
          edge="right"
          size={size}
          onResize={setSize}
          defaultSize="var(--size-layout-sidebar)"
          minSize="var(--size-layout-menu-min)"
          maxSize="calc(var(--size-layout-panel) * 1.5)"
          handleLabel="Resize job queue"
          style={{ borderRight: 'var(--border-width-1) solid var(--color-border-default)' }}
        >
          <div style={{ height: '100%', background: 'var(--color-bg-surface)' }}>
            <div className="pf-text-body-strong" style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 'var(--font-weight-bold)' }}>Print queue</div>
            <div style={{ padding: '0 var(--space-1)' }}>
              {['Dental_Arch_Upper ×6', 'Bracket_v3 ×12', 'Turbine_Blade ×2'].map((j, i) => (
                <ListItem key={j} label={j} selected={i === 0} trailing={<Badge tone={i === 0 ? 'accent' : 'neutral'} variant="soft">{i === 0 ? 'Printing' : 'Queued'}</Badge>} />
              ))}
            </div>
          </div>
        </ResizablePanel>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Viewport />
        </div>
      </div>
    );
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={(p) => (
        <div style={{ width: 'var(--size-field-lg)', height: 'var(--size-control-xl)', border: 'var(--border-width-1) solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <SplitPane
            data-state={p['data-state']}
            disabled={p.disabled}
            defaultValue={0.5}
            first={<div style={{ height: '100%', background: 'var(--color-bg-surface)' }} />}
            second={<div style={{ height: '100%', background: 'var(--color-bg-panel)' }} />}
          />
        </div>
      )}
    />
  ),
};
