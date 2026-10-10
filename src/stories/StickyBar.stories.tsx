import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { fn } from 'storybook/test';
import { StickyBar } from '../components/StickyBar/StickyBar';
import { ScrollArea } from '../components/ScrollArea/ScrollArea';
import { SPACE_STEPS } from '../components/Stack/space';
import { Badge } from '../components/Badge/Badge';
import { Button } from '../components/Button/Button';
import { FieldRow } from '../components/FieldRow/FieldRow';
import { NumberField } from '../components/NumberField/NumberField';
import { SectionTitle } from '../components/SectionTitle/SectionTitle';
import { Select } from '../components/Select/Select';
import { Toggle } from '../components/Toggle/Toggle';

function useSettings() {
  const [s, set] = useState({
    printer: 'Form 4 · Office',
    material: 'Grey V5',
    layer: '0.100',
    fineDetail: false,
    heater: true,
    wiper: true,
    density: 1,
    touchpoint: 0.6,
    internal: true,
    raft: 'Full',
    raftThickness: 2,
    notifyDone: true,
    notifyError: true,
    notifyResin: false,
    autoUpload: true,
    dashboard: true,
  });
  const bind = <K extends keyof typeof s>(k: K) => (v: (typeof s)[K]) => set((p) => ({ ...p, [k]: v }));
  return { s, bind };
}

function SettingsList() {
  const { s, bind } = useSettings();
  const section = (title: string, rows: ReactNode) => (
    <section style={{ padding: '0 var(--space-3) var(--space-2)' }}>
      <SectionTitle size="sm">{title}</SectionTitle>
      {rows}
    </section>
  );
  return (
    <>
      {section('Printer', <>
        <FieldRow label="Printer"><Select label="Printer" value={s.printer} options={['Form 4 · Office', 'Form 4B · Lab', 'Form 3+ · Studio']} onChange={bind('printer')} /></FieldRow>
        <FieldRow label="Heater" info="Warm the resin to 35 °C before printing"><Toggle label="Heater" checked={s.heater} onChange={bind('heater')} /></FieldRow>
        <FieldRow label="Wiper between layers"><Toggle label="Wiper between layers" checked={s.wiper} onChange={bind('wiper')} /></FieldRow>
      </>)}
      {section('Material', <>
        <FieldRow label="Material"><Select label="Material" value={s.material} options={['Grey V5', 'Clear V5', 'Tough 2000', 'Durable', 'Rigid 10K', 'Model V3']} onChange={bind('material')} /></FieldRow>
        <FieldRow label="Layer height"><Select label="Layer height" value={s.layer} options={[{ value: '0.050', label: '0.050 mm' }, { value: '0.100', label: '0.100 mm' }, { value: '0.160', label: '0.160 mm' }]} onChange={bind('layer')} /></FieldRow>
        <FieldRow label="Fine detail mode"><Toggle label="Fine detail mode" checked={s.fineDetail} onChange={bind('fineDetail')} /></FieldRow>
      </>)}
      {section('Supports', <>
        <FieldRow label="Density"><NumberField label="Density" value={s.density} decimals={2} step={0.1} onChange={bind('density')} /></FieldRow>
        <FieldRow label="Touchpoint size" info="Diameter where a support meets the model"><NumberField label="Touchpoint size" value={s.touchpoint} unit="mm" decimals={2} step={0.05} onChange={bind('touchpoint')} /></FieldRow>
        <FieldRow label="Internal supports"><Toggle label="Internal supports" checked={s.internal} onChange={bind('internal')} /></FieldRow>
        <FieldRow label="Raft type"><Select label="Raft type" value={s.raft} options={['Full', 'Mini', 'None']} onChange={bind('raft')} /></FieldRow>
        <FieldRow label="Raft thickness"><NumberField label="Raft thickness" value={s.raftThickness} unit="mm" decimals={1} step={0.5} onChange={bind('raftThickness')} /></FieldRow>
      </>)}
      {section('Notifications', <>
        <FieldRow label="Print finished"><Toggle label="Print finished" checked={s.notifyDone} onChange={bind('notifyDone')} /></FieldRow>
        <FieldRow label="Print error"><Toggle label="Print error" checked={s.notifyError} onChange={bind('notifyError')} /></FieldRow>
        <FieldRow label="Low resin"><Toggle label="Low resin" checked={s.notifyResin} onChange={bind('notifyResin')} /></FieldRow>
      </>)}
      {section('Dashboard', <>
        <FieldRow label="Upload print reports"><Toggle label="Upload print reports" checked={s.autoUpload} onChange={bind('autoUpload')} /></FieldRow>
        <FieldRow label="Show in Dashboard"><Toggle label="Show in Dashboard" checked={s.dashboard} onChange={bind('dashboard')} /></FieldRow>
      </>)}
    </>
  );
}

const shell = {
  width: 'var(--size-layout-panel)',
  height: 'calc(var(--size-layout-panel) * 1.4)',
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-bg-surface)',
  boxShadow: 'var(--elevation-panel), 0 0 0 var(--border-width-1) var(--color-border-subtle)',
};

const HeaderContent = () => (
  <>
    <h2 className="pf-text-title-sm" style={{ flex: 1 }}>Print settings</h2>
    <Badge tone="warning" variant="soft">Unsaved</Badge>
  </>
);

const FooterContent = () => (
  <>
    <span className="pf-text-label-sm" style={{ flex: 1, color: 'var(--color-fg-muted)' }}>3 changes</span>
    <Button variant="outline">Cancel</Button>
    <Button variant="primary">Save changes</Button>
  </>
);

const meta = {
  title: 'Components/Layout/StickyBar',
  component: StickyBar,
  tags: ['expanded'],
  args: { position: 'top', elevation: 'shadow', offset: 0, safeArea: true, onStuckChange: fn() },
  argTypes: {
    position: { control: 'inline-radio', options: ['top', 'bottom'] },
    elevation: { control: 'inline-radio', options: ['border', 'shadow'] },
    offset: { control: 'select', options: SPACE_STEPS },
    as: { control: 'inline-radio', options: [undefined, 'div', 'header', 'footer', 'nav'] },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Sticky header or footer for long panels and settings pages. Its border (and, with `elevation="shadow"`, `--elevation-card`) appears only once content scrolls underneath, detected with an IntersectionObserver sentinel. Pads by the safe-area insets and stacks at `--z-index-sticky`. Scroll the panel to see it engage.',
      },
    },
  },
  render: (args) => (
    <div style={shell}>
      <ScrollArea fade={false} label="Print settings" style={{ flex: 1 }}>
        {args.position === 'top' && <StickyBar {...args}><HeaderContent /></StickyBar>}
        <SettingsList />
        {args.position === 'bottom' && <StickyBar {...args}><FooterContent /></StickyBar>}
      </ScrollArea>
    </div>
  ),
} satisfies Meta<typeof StickyBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const HeaderAndFooter: Story = {
  name: 'Settings with header and footer',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={shell}>
      <ScrollArea fade={false} label="Print settings" style={{ flex: 1 }}>
        <StickyBar position="top"><HeaderContent /></StickyBar>
        <SettingsList />
        <StickyBar position="bottom" elevation="shadow"><FooterContent /></StickyBar>
      </ScrollArea>
    </div>
  ),
};

export const Footer: Story = { args: { position: 'bottom' } };

export const BorderOnly: Story = { args: { elevation: 'border' } };
