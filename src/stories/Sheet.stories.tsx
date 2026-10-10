import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { RotateCcwIcon, SlidersHorizontalIcon } from 'lucide-react';
import { Sheet } from '../components/Sheet/Sheet';
import { Button } from '../components/Button/Button';
import { IconButton } from '../components/IconButton/IconButton';
import { FieldRow } from '../components/FieldRow/FieldRow';
import { Select } from '../components/Select/Select';
import { NumberField } from '../components/NumberField/NumberField';
import { Toggle } from '../components/Toggle/Toggle';
import { ListItem } from '../components/ListItem/ListItem';

/** Demo viewport: the sheet fills it; the reopen button sits above the (empty) layer when closed. */
function Frame({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  return (
    <div style={frame}>
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      {trigger && <div style={{ position: 'relative' }}>{trigger}</div>}
    </div>
  );
}

const frame: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 'calc(var(--size-layout-dialog-lg) + var(--space-16))',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-bg-canvas)',
  display: 'grid',
  placeItems: 'center',
};

function PrintSettings() {
  const [printer, setPrinter] = useState('Form 4 · Ostrich-Fierce');
  const [material, setMaterial] = useState('Grey V5');
  const [layer, setLayer] = useState('0.050 mm');
  const [raft, setRaft] = useState(2);
  const [fine, setFine] = useState(false);
  const [heater, setHeater] = useState(true);
  return (
    <div className="sb-stack" style={{ alignItems: 'stretch' }}>
      <FieldRow label="Printer" layout="stacked">
        <Select label="Printer" value={printer} onChange={setPrinter} options={['Form 4 · Ostrich-Fierce', 'Form 4L · Heron-Quiet', 'Form 3+ · Lynx-Brave']} fullWidth />
      </FieldRow>
      <FieldRow label="Material" layout="stacked">
        <Select label="Material" value={material} onChange={setMaterial} options={['Grey V5', 'Clear V5', 'Tough 2000', 'Model V3']} fullWidth />
      </FieldRow>
      <FieldRow label="Layer height" layout="stacked">
        <Select label="Layer height" value={layer} onChange={setLayer} options={['0.025 mm', '0.050 mm', '0.100 mm', '0.160 mm']} fullWidth />
      </FieldRow>
      <FieldRow label="Raft thickness">
        <NumberField label="Raft thickness" value={raft} onChange={setRaft} unit="mm" decimals={1} step={0.5} min={0} />
      </FieldRow>
      <FieldRow label="Fine detail mode">
        <Toggle label="Fine detail mode" checked={fine} onChange={setFine} />
      </FieldRow>
      <FieldRow label="Pre-heat resin">
        <Toggle label="Pre-heat resin" checked={heater} onChange={setHeater} />
      </FieldRow>
    </div>
  );
}

const meta = {
  title: 'Components/Overlays/Sheet',
  component: Sheet,
  tags: ['expanded'],
  args: {
    open: true,
    onRequestClose: fn(),
    title: 'Print settings',
    description: 'Applies to all 4 models on the build platform.',
    side: 'right',
    size: 'md',
    showHandle: undefined,
    closeOnScrimClick: true,
    inline: true,
    children: null,
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['right', 'left', 'bottom'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    showHandle: { control: 'boolean' },
    children: { control: false },
    footer: { control: false },
    headerActions: { control: false },
    initialFocusRef: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Bottom and side sheets: a surface that slides in from an edge over a `--color-bg-overlay` scrim, with header, scrolling body and footer like Modal. Used for Print settings, job details and pickers on narrow layouts. Motion uses `--motion-duration-base` and `--motion-easing-standard`; widths come from `--size-layout-panel` / `--size-layout-dialog-*`. Focus is trapped and restored, Escape closes, page scroll is locked while open. Bottom sheets can be dragged down by the handle to dismiss.',
      },
    },
  },
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    const close = () => update({ open: false });
    return (
      <Frame
        trigger={
          !open && (
            <Button variant="primary" iconStart={<SlidersHorizontalIcon strokeWidth={2.4} />} onClick={() => update({ open: true })}>
              Print settings
            </Button>
          )
        }
      >
        <Sheet
            {...args}
            open={open}
            onRequestClose={close}
            headerActions={<IconButton label="Reset to defaults" icon={<RotateCcwIcon strokeWidth={2.4} />} size="sm" />}
            footer={
              <>
                <Button variant="link" style={{ marginRight: 'auto' }} onClick={close}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={close}>
                  Apply
                </Button>
              </>
            }
          >
            <PrintSettings />
        </Sheet>
      </Frame>
    );
  },
} satisfies Meta<typeof Sheet>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const LeftSide: Story = {
  args: { side: 'left', size: 'sm', title: 'Job queue', description: 'Form 4 · Ostrich-Fierce' },
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    const jobs = ['Dental_Arch_Upper · 1 h 12 min', 'Bracket_v3 × 6 · 3 h 40 min', 'Turbine_Blade · 5 h 05 min', 'Ring_Setting_Sizes · 48 min'];
    return (
      <Frame trigger={!open && <Button onClick={() => update({ open: true })}>Show job queue</Button>}>
        <Sheet {...args} open={open} onRequestClose={() => update({ open: false })}>
            <div className="sb-stack" style={{ alignItems: 'stretch', gap: 'var(--space-1)' }}>
              {jobs.map((j, i) => (
                <ListItem key={j} label={j} variant="plain" selected={i === 0} onClick={() => {}} />
              ))}
            </div>
        </Sheet>
      </Frame>
    );
  },
};

export const BottomSheet: Story = {
  args: { side: 'bottom', size: 'sm', title: 'Choose material', description: 'Form 4 compatible resins' },
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    const [material, setMaterial] = useState('Grey V5');
    const materials = ['Grey V5', 'Clear V5', 'White V5', 'Black V5', 'Tough 2000', 'Draft V2', 'Precision Model'];
    return (
      <Frame trigger={!open && <Button onClick={() => update({ open: true })}>Choose material</Button>}>
        <Sheet
            {...args}
            open={open}
            onRequestClose={() => update({ open: false })}
            footer={
              <Button variant="primary" style={{ marginLeft: 'auto' }} onClick={() => update({ open: false })}>
                Use {material}
              </Button>
            }
          >
            <div className="sb-stack" style={{ alignItems: 'stretch', gap: 'var(--space-1)' }}>
              {materials.map((m) => (
                <ListItem key={m} label={m} variant="plain" selected={m === material} onClick={() => setMaterial(m)} />
              ))}
            </div>
        </Sheet>
      </Frame>
    );
  },
};

export const Large: Story = { args: { size: 'lg' } };
export const Small: Story = { args: { size: 'sm' } };
