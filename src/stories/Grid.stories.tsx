import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid } from '../components/Grid/Grid';
import { SPACE_STEPS } from '../components/Stack/space';
import { AspectRatio } from '../components/AspectRatio/AspectRatio';
import { Badge } from '../components/Badge/Badge';
import { Card } from '../components/Card/Card';
import type { Tone } from '../lib/types';

type Model = { name: string; size: string; material: string; tone: string; status: { label: string; tone: Tone } };

const MODELS: Model[] = [
  { name: 'Dental_Arch_Upper', size: '12.4 × 8.1 × 2.2 cm', material: 'Model V3', tone: 'var(--color-accent-tone-blue)', status: { label: 'Supported', tone: 'success' } },
  { name: 'Bracket_v3', size: '4.0 × 2.5 × 1.8 cm', material: 'Tough 2000', tone: 'var(--color-accent-tone-green)', status: { label: 'Needs supports', tone: 'warning' } },
  { name: 'Turbine_Blade', size: '9.7 × 3.3 × 1.1 cm', material: 'Grey V5', tone: 'var(--color-accent-tone-amber)', status: { label: 'Supported', tone: 'success' } },
  { name: 'Hinge_Clip_x4', size: '2.2 × 1.6 × 0.8 cm', material: 'Durable', tone: 'var(--color-accent-tone-magenta)', status: { label: 'Undersupported', tone: 'danger' } },
  { name: 'Gear_Housing', size: '6.5 × 6.5 × 3.0 cm', material: 'Grey V5', tone: 'var(--color-accent-tone-orange)', status: { label: 'Supported', tone: 'success' } },
  { name: 'Ring_Prototype', size: '2.1 × 2.1 × 0.6 cm', material: 'Castable Wax', tone: 'var(--color-accent-tone-red)', status: { label: 'Repair mesh', tone: 'warning' } },
  { name: 'Drone_Arm_L', size: '14.8 × 2.6 × 1.9 cm', material: 'Rigid 10K', tone: 'var(--color-accent-tone-blue)', status: { label: 'Supported', tone: 'success' } },
  { name: 'Calibration_Cube', size: '2.0 × 2.0 × 2.0 cm', material: 'Clear V5', tone: 'var(--color-accent-tone-green)', status: { label: 'Supported', tone: 'success' } },
];

/** Isometric block on a build-plate grid, coloured from tokens so it reads in both themes. */
function ModelThumb({ tone }: { tone: string }) {
  return (
    <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g style={{ stroke: 'var(--color-border-default)' }} strokeWidth="0.5">
        {[20, 40, 60, 80].map((y) => <line key={`h${y}`} x1="0" x2="160" y1={y} y2={y} />)}
        {[20, 40, 60, 80, 100, 120, 140].map((x) => <line key={`v${x}`} y1="0" y2="100" x1={x} x2={x} />)}
      </g>
      <polygon points="80,22 116,40 80,58 44,40" style={{ fill: tone }} fillOpacity="0.55" />
      <polygon points="44,40 80,58 80,84 44,66" style={{ fill: tone }} />
      <polygon points="116,40 80,58 80,84 116,66" style={{ fill: tone }} fillOpacity="0.8" />
    </svg>
  );
}

function ModelCard({ model }: { model: Model }) {
  return (
    <Card role="listitem" padding="none" style={{ overflow: 'hidden' }}>
      <AspectRatio ratio={16 / 10} radius="none">
        <ModelThumb tone={model.tone} />
      </AspectRatio>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', padding: 'var(--space-2)' }}>
        <span className="pf-text-body-strong" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.name}</span>
        <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>{model.size} · {model.material}</span>
        <span><Badge tone={model.status.tone} variant="soft">{model.status.label}</Badge></span>
      </div>
    </Card>
  );
}

const meta = {
  title: 'Components/Layout/Grid',
  component: Grid,
  tags: ['expanded'],
  args: { columns: { base: 1, sm: 2, md: 3, lg: 4 }, gap: 3, align: 'stretch', role: 'list', 'aria-label': 'Models on build plate' },
  argTypes: {
    columns: { control: 'object' },
    minItemWidth: { control: 'select', options: [undefined, 'field-lg', 'menu-min', 'sidebar', 'panel', 'dialog-sm'] },
    gap: { control: 'select', options: SPACE_STEPS },
    rowGap: { control: 'select', options: [undefined, ...SPACE_STEPS] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end', 'stretch'] },
    children: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Responsive grid that answers to its own container width (container query units), not the viewport. `columns` takes a count or `{ base, sm, md, lg }` with breakpoints at 1.5×, 2.5× and 3.5× `--size-layout-panel`; `minItemWidth` auto-fills columns at least that wide. Used for model libraries, material swatches and printer fleets.',
      },
    },
  },
  render: (args) => (
    <div style={{ width: '100%' }}>
      <Grid {...args}>
        {MODELS.map((m) => <ModelCard key={m.name} model={m} />)}
      </Grid>
    </div>
  ),
} satisfies Meta<typeof Grid>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ResizableContainer: Story = {
  name: 'Responsive (drag the corner)',
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        width: 'calc(var(--size-layout-panel) * 2.5)',
        maxWidth: '100%',
        minWidth: 'var(--size-layout-sidebar)',
        resize: 'horizontal',
        overflow: 'auto',
        padding: 'var(--space-3)',
        border: 'var(--border-width-1) dashed var(--color-border-strong)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <Grid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} role="list" aria-label="Models on build plate">
        {MODELS.map((m) => <ModelCard key={m.name} model={m} />)}
      </Grid>
    </div>
  ),
};

export const FixedColumns: Story = { args: { columns: 3, gap: 2 } };

export const AutoFill: Story = {
  name: 'Auto-fill by min item width',
  args: { minItemWidth: 'menu-min', gap: 3 },
};

export const PanelWidth: Story = {
  name: 'Inside a tool panel',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-panel-demo" style={{ padding: 'var(--space-2)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-panel)' }}>
      <Grid columns={{ base: 2, md: 4 }} gap={2} role="list" aria-label="Models">
        {MODELS.slice(0, 4).map((m) => <ModelCard key={m.name} model={m} />)}
      </Grid>
    </div>
  ),
};
