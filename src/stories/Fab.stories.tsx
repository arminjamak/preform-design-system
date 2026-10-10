import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { PlusIcon, Rotate3dIcon, WandSparklesIcon } from 'lucide-react';
import { Fab } from '../components/Fab/Fab';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Actions/Fab',
  component: Fab,
  tags: ['expanded'],
  args: { label: 'Add model', icon: <PlusIcon strokeWidth={2.4} />, extended: false, size: 'md', tone: 'accent', disabled: false, onClick: fn() },
  argTypes: {
    size: { control: 'inline-radio', options: ['md', 'lg'] },
    tone: { control: 'inline-radio', options: ['accent', 'surface'] },
    icon: { control: 'select', options: ['plus', 'auto-orient', 'rotate'], mapping: { plus: <PlusIcon strokeWidth={2.4} />, 'auto-orient': <WandSparklesIcon strokeWidth={2.2} />, rotate: <Rotate3dIcon strokeWidth={2.2} /> } },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Floating action button pinned over the 3D viewport (Add model, Auto-orient). A circular disc on `elevation.popover` that lifts to `elevation.modal` on hover; `accent` uses `bg.accent`, `surface` uses `bg.surface`. Extended Fabs show the label beside the icon; icon-only Fabs use it as `aria-label`.\n\n' +
          '**Button coverage:** Primary = `Button variant="primary"`, Secondary = `variant="outline"`, Tertiary = `variant="ghost"`, Destructive = `variant="danger"`, Text = `variant="link"`, Loading = `Button loading`, Overflow = `Menu`. Use a Fab only for the one main action floating over the viewport.',
      },
    },
  },
} satisfies Meta<typeof Fab>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div className="sb-row">
      <Fab {...args} tone="accent" />
      <Fab {...args} tone="surface" label="Auto-orient" icon={<WandSparklesIcon strokeWidth={2.2} />} />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row">
      <Fab {...args} size="md" />
      <Fab {...args} size="lg" />
      <Fab {...args} size="md" extended />
      <Fab {...args} size="lg" extended />
    </div>
  ),
};

export const Extended: Story = { args: { extended: true } };

export const InViewport: Story = {
  render: (args) => (
    <div
      style={{
        position: 'relative',
        width: 'var(--size-layout-dialog-lg)',
        height: 'var(--size-layout-dialog-sm)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-canvas)',
        boxShadow: 'var(--elevation-card)',
        overflow: 'hidden',
      }}
    >
      <span className="pf-text-caption" style={{ position: 'absolute', top: 'var(--space-3)', left: 'var(--space-3)', color: 'var(--color-fg-muted)' }}>
        Form 4 · Clear V4 · 0.050 mm
      </span>
      <div style={{ position: 'absolute', right: 'var(--space-4)', bottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <Fab {...args} tone="surface" label="Auto-orient" icon={<WandSparklesIcon strokeWidth={2.2} />} extended={false} />
        <Fab {...args} />
      </div>
    </div>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'accent', render: (p) => <Fab {...args} tone="accent" {...p} /> },
        { label: 'surface', render: (p) => <Fab {...args} tone="surface" {...p} /> },
        { label: 'extended', render: (p) => <Fab {...args} extended {...p} /> },
      ]}
    />
  ),
};
