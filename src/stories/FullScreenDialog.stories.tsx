import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { CircleHelpIcon, WifiIcon } from 'lucide-react';
import { FullScreenDialog } from '../components/FullScreenDialog/FullScreenDialog';
import { Button } from '../components/Button/Button';
import { Stepper, type Step } from '../components/Stepper/Stepper';
import { FieldRow } from '../components/FieldRow/FieldRow';
import { TextField } from '../components/TextField/TextField';
import { Select } from '../components/Select/Select';
import { Callout } from '../components/Callout/Callout';
import { Checkbox } from '../components/Checkbox/Checkbox';
import { Card } from '../components/Card/Card';

const frame: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 'calc(var(--size-layout-dialog-lg) + var(--space-24))',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  background: 'var(--color-bg-canvas)',
  display: 'grid',
  placeItems: 'center',
};

function Frame({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  return (
    <div style={frame}>
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      {trigger && <div style={{ position: 'relative' }}>{trigger}</div>}
    </div>
  );
}

const STEPS = ['Unbox', 'Network', 'Resin tank', 'Calibrate', 'Done'];

function StepBody({ index }: { index: number }) {
  const [name, setName] = useState('Ostrich-Fierce');
  const [network, setNetwork] = useState('Formlabs-Lab-5G');
  const [password, setPassword] = useState('');
  const [checks, setChecks] = useState({ tape: true, platform: false, tank: false });
  const heading = (title: string, text: string) => (
    <div className="sb-stack" style={{ gap: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
      <h3 className="pf-text-title">{title}</h3>
      <p className="pf-text-body" style={{ color: 'var(--color-fg-muted)' }}>
        {text}
      </p>
    </div>
  );
  switch (index) {
    case 0:
      return (
        <>
          {heading('Unbox your Form 4', 'Remove all packaging before powering on. Keep the box for transport.')}
          <Card padding="md">
            <div className="sb-stack">
              <Checkbox showLabel label="Removed orange shipping tape from the cover" checked={checks.tape} onChange={(v) => setChecks({ ...checks, tape: v })} />
              <Checkbox showLabel label="Took out the foam insert under the build platform" checked={checks.platform} onChange={(v) => setChecks({ ...checks, platform: v })} />
              <Checkbox showLabel label="Unlocked the resin tank carrier" checked={checks.tank} onChange={(v) => setChecks({ ...checks, tank: v })} />
            </div>
          </Card>
        </>
      );
    case 1:
      return (
        <>
          {heading('Connect to a network', 'Your printer uploads jobs and reports status to Dashboard over Wi-Fi or Ethernet.')}
          <div className="sb-stack" style={{ alignItems: 'stretch' }}>
            <FieldRow label="Printer name" layout="stacked">
              <TextField label="Printer name" value={name} onChange={setName} fullWidth />
            </FieldRow>
            <FieldRow label="Wi-Fi network" layout="stacked">
              <Select label="Wi-Fi network" value={network} onChange={setNetwork} options={['Formlabs-Lab-5G', 'Formlabs-Guest', 'Workshop-2.4G']} fullWidth />
            </FieldRow>
            <FieldRow label="Password" layout="stacked">
              <TextField label="Password" type="password" value={password} onChange={setPassword} iconStart={<WifiIcon />} fullWidth />
            </FieldRow>
          </div>
        </>
      );
    case 2:
      return (
        <>
          {heading('Insert the resin tank', 'Slide the LT tank into the carrier until it clicks, then insert a Grey V5 cartridge.')}
          <Callout tone="info" title="New tank detected">
            Resin Tank V2 · 0 layers printed. PreForm will track usage automatically.
          </Callout>
        </>
      );
    case 3:
      return (
        <>
          {heading('Calibrate', 'The printer levels the build platform and checks the light processing unit. This takes about 4 minutes.')}
          <Callout tone="warning" title="Keep the cover closed">
            Opening the cover pauses calibration.
          </Callout>
        </>
      );
    default:
      return heading('Ostrich-Fierce is ready', 'Send your first print from PreForm or start a test print from the touchscreen.');
  }
}

const meta = {
  title: 'Components/Overlays/FullScreenDialog',
  component: FullScreenDialog,
  tags: ['expanded'],
  args: {
    open: true,
    onRequestClose: fn(),
    title: 'Set up Form 4',
    subtitle: undefined,
    contentWidth: 'md',
    closeLabel: 'Exit setup',
    inline: true,
    children: null,
  },
  argTypes: {
    contentWidth: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'full'] },
    children: { control: false },
    primaryAction: { control: false },
    secondaryActions: { control: false },
    progress: { control: false },
    footer: { control: false },
    initialFocusRef: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-viewport dialog for multi-step flows such as "Set up Form 4" or "Add a printer": a surface top bar with close, title and a pill primary action, optional progress row, and a centred scrolling body on `--color-bg-panel`. Focus is trapped and restored, Escape closes, page scroll is locked. Enters with `--motion-duration-base`.',
      },
    },
  },
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    const [index, setIndex] = useState(0);
    const last = index === STEPS.length - 1;
    const steps: Step[] = STEPS.map((label, i) => ({ id: label, label, status: i < index ? 'done' : i === index ? 'active' : 'pending' }));
    const close = () => {
      update({ open: false });
      setIndex(0);
    };
    return (
      <Frame trigger={!open && <Button variant="primary" onClick={() => update({ open: true })}>Set up Form 4</Button>}>
        <FullScreenDialog
          {...args}
          open={open}
          onRequestClose={close}
          subtitle={args.subtitle ?? `Step ${index + 1} of ${STEPS.length} · ${STEPS[index]}`}
          progress={<Stepper steps={steps} orientation="horizontal" />}
          secondaryActions={
            <>
              <Button variant="ghost" size="md" iconStart={<CircleHelpIcon strokeWidth={2.2} />}>
                Help
              </Button>
              {index > 0 && (
                <Button variant="outline" size="md" onClick={() => setIndex(index - 1)}>
                  Back
                </Button>
              )}
            </>
          }
          primaryAction={{ label: last ? 'Finish' : 'Continue', onClick: () => (last ? close() : setIndex(index + 1)) }}
        >
          <StepBody index={index} />
        </FullScreenDialog>
      </Frame>
    );
  },
} satisfies Meta<typeof FullScreenDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithFooter: Story = {
  args: { title: 'Add printers to Dashboard', subtitle: 'Select the printers on your network to claim', contentWidth: 'sm' },
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    const [picked, setPicked] = useState<Record<string, boolean>>({ 'Ostrich-Fierce': true });
    const printers = ['Ostrich-Fierce · Form 4', 'Heron-Quiet · Form 4L', 'Lynx-Brave · Form 3+', 'Otter-Swift · Fuse 1+'];
    const count = Object.values(picked).filter(Boolean).length;
    return (
      <Frame trigger={!open && <Button variant="primary" onClick={() => update({ open: true })}>Add printers</Button>}>
        <FullScreenDialog
          {...args}
          open={open}
          onRequestClose={() => update({ open: false })}
          primaryAction={{ label: `Add ${count} printer${count === 1 ? '' : 's'}`, onClick: () => update({ open: false }), disabled: count === 0 }}
          footer={
            <>
              <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>
                {count} of {printers.length} selected
              </span>
              <Button variant="link" style={{ marginLeft: 'auto' }} onClick={() => setPicked({})}>
                Clear selection
              </Button>
            </>
          }
        >
          <Card padding="md">
            <div className="sb-stack">
              {printers.map((p) => {
                const key = p.split(' · ')[0];
                return <Checkbox key={p} showLabel label={p} checked={!!picked[key]} onChange={(v) => setPicked({ ...picked, [key]: v })} />;
              })}
            </div>
          </Card>
        </FullScreenDialog>
      </Frame>
    );
  },
};

export const Saving: Story = {
  args: { title: 'Firmware update', subtitle: 'Form 4 · 1.9.1 → 1.9.2', contentWidth: 'sm' },
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    return (
      <Frame trigger={!open && <Button variant="primary" onClick={() => update({ open: true })}>Update firmware</Button>}>
        <FullScreenDialog {...args} open={open} onRequestClose={() => update({ open: false })} primaryAction={{ label: 'Installing', onClick: () => {}, loading: true }}>
          <Callout tone="info" title="Do not power off the printer">
            Ostrich-Fierce will restart when the update finishes. Queued jobs stay in the queue.
          </Callout>
        </FullScreenDialog>
      </Frame>
    );
  },
};
