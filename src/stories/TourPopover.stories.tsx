import { useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { LayoutGridIcon, MousePointer2Icon, RotateCwIcon, ScissorsIcon, TowerControlIcon } from 'lucide-react';
import { Tour, TourPopover, useTour, type TourStep } from '../components/TourPopover/TourPopover';
import { Button } from '../components/Button/Button';
import { IconButton } from '../components/IconButton/IconButton';
import { FieldRow } from '../components/FieldRow/FieldRow';
import { Select } from '../components/Select/Select';

const shell: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 'calc(var(--size-layout-dialog-lg) + var(--space-8))',
  display: 'grid',
  gridTemplateRows: 'var(--size-layout-nav) 1fr',
  gridTemplateColumns: 'var(--size-layout-rail) 1fr var(--size-layout-panel)',
  overflow: 'hidden',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-bg-canvas)',
};

/** A miniature PreForm window whose parts carry `data-tour` hooks. */
function Workspace({ startRef, children }: { startRef?: RefObject<HTMLButtonElement>; children?: ReactNode }) {
  return (
    <div style={shell}>
      <header
        style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '0 var(--space-3)', background: 'var(--color-bg-inverse)', color: 'var(--color-fg-on-inverse)' }}
      >
        <span className="pf-text-body-strong">PreForm</span>
        <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-on-inverse-muted)' }}>
          Bracket_v3.form
        </span>
        <span data-tour="printer" className="pf-text-label" style={{ marginLeft: 'auto', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-inverse-active)' }}>
          Form 4 · Ostrich-Fierce
        </span>
      </header>
      <nav
        aria-label="Tools"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)', paddingTop: 'var(--space-2)', background: 'var(--color-bg-surface)', borderRight: 'var(--border-width-1) solid var(--color-border-default)' }}
      >
        <IconButton label="Select" icon={<MousePointer2Icon />} size="lg" />
        <span data-tour="orient">
          <IconButton label="Orientation" icon={<RotateCwIcon />} size="lg" />
        </span>
        <span data-tour="supports">
          <IconButton label="Supports" icon={<TowerControlIcon />} size="lg" />
        </span>
        <IconButton label="Layout" icon={<LayoutGridIcon />} size="lg" />
        <IconButton label="Cut" icon={<ScissorsIcon />} size="lg" />
      </nav>
      <main style={{ display: 'grid', placeItems: 'center' }}>
        <div
          data-tour="model"
          style={{ width: 'var(--space-24)', height: 'var(--space-24)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-muted)', boxShadow: 'var(--elevation-card)' }}
          aria-label="Bracket_v3 model"
          role="img"
        />
      </main>
      <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-bg-surface)', borderLeft: 'var(--border-width-1) solid var(--color-border-default)' }}>
        <p className="pf-text-title-sm">Job setup</p>
        <div data-tour="settings" className="sb-stack" style={{ alignItems: 'stretch' }}>
          <FieldRow label="Material">
            <Select label="Material" value="Grey V5" options={['Grey V5', 'Clear V5']} onChange={() => {}} />
          </FieldRow>
          <FieldRow label="Layer height">
            <Select label="Layer height" value="0.050 mm" options={['0.050 mm', '0.100 mm']} onChange={() => {}} />
          </FieldRow>
        </div>
        <Button ref={startRef} variant="primary" style={{ marginTop: 'auto' }} fullWidth>
          Start print
        </Button>
      </aside>
      {children}
    </div>
  );
}

const STEP_TEXT = [
  { title: 'Orient for print quality', target: '[data-tour="orient"]', body: 'Auto-orient tilts parts so overhangs and cosmetic faces print cleanly. You can still drag the rotation rings by hand.' },
  { title: 'Generate supports', target: '[data-tour="supports"]', body: 'Supports are now 30% faster to remove. Adjust density and touchpoint size in the Supports panel.' },
];

const meta = {
  title: 'Components/Overlays/TourPopover',
  component: TourPopover,
  tags: ['expanded'],
  args: {
    open: true,
    target: STEP_TEXT[1].target,
    title: STEP_TEXT[1].title,
    children: STEP_TEXT[1].body,
    step: 1,
    total: 5,
    placement: 'auto',
    spotlight: true,
    nextLabel: 'Next',
    finishLabel: 'Finish',
    backLabel: 'Back',
    skipLabel: 'Skip tour',
    onNext: fn(),
    onBack: fn(),
    onSkip: fn(),
    inline: true,
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['auto', 'top', 'bottom', 'left', 'right'] },
    target: { control: 'select', options: ['[data-tour="orient"]', '[data-tour="supports"]', '[data-tour="model"]', '[data-tour="settings"]', '[data-tour="printer"]', '[data-tour="missing"]'] },
    step: { control: { type: 'number', min: 0 } },
    total: { control: { type: 'number', min: 1 } },
    children: { control: 'text' },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Coach-mark popover for product tours: points at a target (ref or CSS selector) with an arrow, cuts a spotlight out of the `--color-bg-overlay` scrim, shows "2 of 5" with progress dots and Back / Next / Skip. Follows the target every frame and flips sides when there is no room. `useTour(steps)` + `<Tour {...tourProps} />` walk a steps array. Focus is trapped on the card; Escape skips; ← / → step.',
      },
    },
  },
  render: function Render(args) {
    const [{ open, step }, update] = useArgs();
    return (
      <Workspace>
        {!open && (
          <div style={{ position: 'absolute', left: '50%', bottom: 'var(--space-4)', translate: '-50% 0' }}>
            <Button variant="primary" onClick={() => update({ open: true })}>
              Show tip
            </Button>
          </div>
        )}
        <TourPopover
          {...args}
          open={open}
          step={step}
          onNext={() => update({ step: Math.min(step + 1, args.total - 1) })}
          onBack={() => update({ step: Math.max(step - 1, 0) })}
          onSkip={() => update({ open: false })}
        />
      </Workspace>
    );
  },
} satisfies Meta<typeof TourPopover>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const FirstStep: Story = { args: { step: 0, target: STEP_TEXT[0].target, title: STEP_TEXT[0].title, children: STEP_TEXT[0].body } };

export const PanelTarget: Story = {
  args: { step: 3, target: '[data-tour="settings"]', title: 'Check material and layer height', children: 'PreForm remembers the last material you used on each printer. Finer layers add detail and time.' },
};

export const NoTarget: Story = {
  args: { step: 0, target: null, title: "Welcome to PreForm 3.45", children: 'Take a one-minute tour of the new orientation and support tools.', nextLabel: 'Start tour' },
};

/** `useTour` walks the steps; one step targets the Start print button by ref. */
export const GuidedTour: Story = {
  parameters: { controls: { disable: true } },
  render: function Render(args) {
    const startRef = useRef<HTMLButtonElement>(null);
    const steps: TourStep[] = [
      { id: 'welcome', title: "What's new in PreForm 3.45", content: 'A quick look at the tools that changed. It takes about a minute.' },
      { id: 'orient', target: '[data-tour="orient"]', title: STEP_TEXT[0].title, content: STEP_TEXT[0].body },
      { id: 'supports', target: '[data-tour="supports"]', title: STEP_TEXT[1].title, content: STEP_TEXT[1].body },
      { id: 'settings', target: '[data-tour="settings"]', title: 'Material and layer height', content: 'Pick the resin in the tank and how fine each layer should be.', placement: 'left' },
      { id: 'printer', target: '[data-tour="printer"]', title: 'Choose a printer', content: 'Switch between printers on your network; PreForm checks material compatibility.' },
      { id: 'start', target: startRef, title: 'Send it', content: 'Upload the job to Ostrich-Fierce. You can follow progress in Dashboard.' },
    ];
    const tour = useTour(steps, { defaultOpen: true, onFinish: args.onNext, onSkip: args.onSkip });
    return (
      <Workspace startRef={startRef}>
        {!tour.open && (
          <div style={{ position: 'absolute', left: '50%', bottom: 'var(--space-4)', translate: '-50% 0' }}>
            <Button variant="primary" onClick={() => tour.start()}>
              Restart tour
            </Button>
          </div>
        )}
        <Tour {...tour.tourProps} inline />
      </Workspace>
    );
  },
};
