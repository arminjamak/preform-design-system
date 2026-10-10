import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { CircleDollarSignIcon, DropletsIcon, LayersIcon, PrinterIcon } from 'lucide-react';
import { Accordion, AccordionItem, Collapsible, type AccordionProps, type AccordionVariant } from '../components/Accordion/Accordion';
import { Badge } from '../components/Badge/Badge';
import { FieldRow } from '../components/FieldRow/FieldRow';
import { KeyValueList } from '../components/KeyValueList/KeyValueList';
import { NumberField } from '../components/NumberField/NumberField';
import { Toggle } from '../components/Toggle/Toggle';
import { StateMatrix } from './helpers/StateMatrix';

const iconStyle = { width: 'var(--size-icon-xs)', height: 'var(--size-icon-xs)' };

function ValidationRows() {
  const [checks, setChecks] = useState({ undersupported: true, walls: true, cups: false });
  const set = (key: keyof typeof checks) => (v: boolean) => setChecks((c) => ({ ...c, [key]: v }));
  return (
    <>
      <FieldRow label="Undersupported models"><Toggle label="Undersupported models" checked={checks.undersupported} onChange={set('undersupported')} /></FieldRow>
      <FieldRow label="Minimum wall thickness"><Toggle label="Minimum wall thickness" checked={checks.walls} onChange={set('walls')} /></FieldRow>
      <FieldRow label="Cups and suction"><Toggle label="Cups and suction" checked={checks.cups} onChange={set('cups')} /></FieldRow>
    </>
  );
}

function SupportRows() {
  const [size, setSize] = useState(0.6);
  const [density, setDensity] = useState(1);
  return (
    <>
      <FieldRow label="Touchpoint size" info="Diameter where a support meets the model"><NumberField label="Touchpoint size" value={size} unit="mm" step={0.05} decimals={2} onChange={setSize} /></FieldRow>
      <FieldRow label="Density"><NumberField label="Density" value={density} decimals={2} step={0.1} onChange={setDensity} /></FieldRow>
    </>
  );
}

const jobRows = [
  { key: 'Printer', value: 'Form 4' },
  { key: 'Material', value: 'Grey V5' },
  { key: 'Layer height', value: '0.100 mm' },
  { key: 'Estimated time', value: '2 h 14 min' },
];

const volumeRows = [
  { key: 'Model(s)', value: '< 0.10 mL', indent: true },
  { key: 'Supports', value: '0.03 mL', indent: true },
  { key: 'Raft', value: '0.01 mL', indent: true },
];

function PrintSections() {
  return (
    <>
      <AccordionItem value="validation" title="Print Validation" meta={<Badge tone="success" variant="soft">Passed</Badge>}>
        <ValidationRows />
      </AccordionItem>
      <AccordionItem value="supports" title="Supports" meta="Auto">
        <SupportRows />
      </AccordionItem>
      <AccordionItem value="job" title="Job Setup" meta="Form 4">
        <KeyValueList rows={jobRows} />
      </AccordionItem>
      <AccordionItem value="layers" title="Layer Slicer" disabled meta="Generate supports first" />
    </>
  );
}

const meta = {
  title: 'Components/Layout/Accordion',
  component: Accordion,
  tags: ['expanded'],
  args: {
    type: 'multiple',
    variant: 'panel',
    collapsible: true,
    headingLevel: 3,
    value: ['validation'],
    onValueChange: fn(),
    children: null,
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['single', 'multiple'] },
    variant: { control: 'inline-radio', options: ['plain', 'bordered', 'panel'] },
    headingLevel: { control: 'inline-radio', options: [2, 3, 4, 5, 6] },
    value: { control: 'check', options: ['validation', 'supports', 'job', 'layers'] },
    defaultValue: { control: false },
    children: { control: false },
  },
  decorators: [(S) => <div className="sb-panel-demo"><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Collapsible sections with the PreForm ▸/▾ caret, as in the Print Validation and Summary sidebars. Headers are buttons inside headings (↑/↓, Home/End move between them); height animates with `--motion-duration-base` / `--motion-easing-standard`. `Collapsible` is the single standalone section.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs<AccordionProps>();
    return (
      <Accordion
        {...args}
        value={value}
        onValueChange={(v) => {
          update({ value: v });
          args.onValueChange?.(v);
        }}
      >
        <PrintSections />
      </Accordion>
    );
  },
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  parameters: { layout: 'padded', controls: { disable: true } },
  decorators: [],
  render: () => (
    <div className="sb-row" style={{ alignItems: 'flex-start', width: '100%' }}>
      {(['panel', 'bordered', 'plain'] as AccordionVariant[]).map((variant) => (
        <div key={variant} className="sb-stack" style={{ width: 'var(--size-layout-panel)', alignItems: 'stretch' }}>
          <span className="pf-text-caption" style={{ color: 'var(--color-fg-muted)', textTransform: 'uppercase' }}>{variant}</span>
          <Accordion variant={variant} defaultValue={['validation']}>
            <PrintSections />
          </Accordion>
        </div>
      ))}
    </div>
  ),
};

export const SingleOpen: Story = {
  args: { type: 'single', variant: 'bordered', value: ['supports'] },
};

export const SummaryCard: Story = {
  name: 'Summary (plain, with icons)',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-subtle)', boxShadow: 'var(--elevation-card)' }}>
      <h2 className="pf-text-body-strong" style={{ fontWeight: 'var(--font-weight-bold)', paddingBottom: 'var(--space-1)' }}>Summary</h2>
      <Accordion variant="plain" defaultValue={['volume', 'cost']}>
        <AccordionItem value="volume" title="Volume" meta="0.14 mL" icon={<DropletsIcon strokeWidth={2.4} style={iconStyle} />}>
          <KeyValueList rows={volumeRows} />
        </AccordionItem>
        <AccordionItem value="cost" title="Total print cost" meta="$1.86" icon={<CircleDollarSignIcon strokeWidth={2.4} style={iconStyle} />}>
          <KeyValueList rows={[{ key: 'Model cost', value: '$1.42', indent: true }, { key: 'Support & raft cost', value: '$0.44', indent: true }]} />
        </AccordionItem>
        <AccordionItem value="time" title="Print time" meta="2 h 14 min" icon={<LayersIcon strokeWidth={2.4} style={iconStyle} />}>
          <KeyValueList rows={[{ key: 'Layers', value: '1,284', indent: true }, { key: 'Layer height', value: '0.100 mm', indent: true }]} />
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const StandaloneCollapsible: Story = {
  name: 'Collapsible',
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <div className="sb-stack" style={{ alignItems: 'stretch' }}>
        <Collapsible title="Print Validation" open={open} onOpenChange={setOpen} meta={<Badge tone="success" variant="soft">Passed</Badge>}>
          <ValidationRows />
        </Collapsible>
        <Collapsible variant="bordered" title="Printer details" icon={<PrinterIcon strokeWidth={2.4} style={iconStyle} />} meta="Form 4 · Office">
          <KeyValueList rows={[{ key: 'Serial', value: 'Form4-ReliableOtter' }, { key: 'Firmware', value: '1.9.2' }, { key: 'Resin tank', value: 'Grey V5 · 412 layers' }]} />
        </Collapsible>
      </div>
    );
  },
};

export const States: Story = {
  parameters: { layout: 'padded', controls: { disable: true } },
  decorators: [],
  render: () => (
    <StateMatrix
      render={() => null}
      rows={(['panel', 'bordered', 'plain'] as AccordionVariant[]).map((variant) => ({
        label: variant,
        render: (p) => (
          <div style={{ width: 'var(--size-field-lg)' }}>
            <Collapsible variant={variant} title="Supports" meta="Auto" data-state={p['data-state']} disabled={p.disabled}>
              <span className="pf-text-body-sm">Touchpoint 0.60 mm</span>
            </Collapsible>
          </div>
        ),
      }))}
    />
  ),
};
