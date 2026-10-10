import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { WifiOffIcon } from 'lucide-react';
import { Banner, type BannerTone } from '../components/Banner/Banner';
import { Button } from '../components/Button/Button';

const TONES: BannerTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

const meta = {
  title: 'Components/Feedback/Banner',
  component: Banner,
  tags: ['expanded'],
  args: {
    tone: 'info',
    variant: 'soft',
    title: 'Firmware 1.9.2 is available for Form 4',
    description: 'Adds faster heating and improved resin level detection.',
    actions: true as unknown as ReactNode,
    dismissible: true,
    sticky: false,
    onDismiss: fn(),
  },
  argTypes: {
    tone: { control: 'select', options: TONES },
    variant: { control: 'inline-radio', options: ['soft', 'solid'] },
    actions: {
      control: 'boolean',
      mapping: {
        true: (
          <Button size="sm" variant="outline">
            Update now
          </Button>
        ),
        false: undefined,
      },
    },
    icon: { control: false },
  },
  decorators: [(S) => <div style={{ width: 'calc(var(--size-layout-dialog-lg) * 1.5)', maxWidth: '100%' }}><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Edge-to-edge, square-cornered notice at the top of a view (firmware updates, offline mode). `soft` uses `--color-status-*-soft`; `solid` uses full-strength fills. Warning and danger render as `role="alert"`, others as `role="status"`. `sticky` pins it with `--z-index-sticky`.',
      },
    },
  },
} satisfies Meta<typeof Banner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const content: Record<BannerTone, { title: string; description: string; action?: string }> = {
  neutral: { title: 'Dashboard maintenance on Sunday', description: 'Remote printing may be unavailable 02:00–03:00 UTC.' },
  info: { title: 'Firmware 1.9.2 is available for Form 4', description: 'Adds faster heating and improved resin level detection.', action: 'Update now' },
  success: { title: 'Form 4 updated to 1.9.2', description: 'The printer is ready for the next job.' },
  warning: { title: 'Resin tank nearing end of life', description: 'Grey V5 tank on Form 4 · Studio has 48 hours of use left.', action: 'Order tank' },
  danger: { title: 'Print failed on Form 4 · Studio', description: 'Bracket_v3 stopped at layer 412: resin cartridge empty.', action: 'View job' },
};

function toneStack(variant: 'soft' | 'solid') {
  return function Render(args: Story['args']) {
    return (
      <div className="sb-stack" style={{ alignItems: 'stretch', gap: 'var(--space-4)' }}>
        {TONES.map((t) => (
          <Banner
            key={t}
            {...args}
            variant={variant}
            tone={t}
            title={content[t].title}
            description={content[t].description}
            actions={content[t].action ? <Button size="sm" variant="outline">{content[t].action}</Button> : undefined}
          />
        ))}
      </div>
    );
  };
}

export const SoftTones: Story = { parameters: { controls: { include: ['dismissible'] } }, render: toneStack('soft') };

export const SolidTones: Story = { parameters: { controls: { include: ['dismissible'] } }, render: toneStack('solid') };

export const Offline: Story = {
  args: {
    tone: 'neutral',
    variant: 'solid',
    icon: <WifiOffIcon strokeWidth={2} />,
    title: 'You are offline.',
    description: 'Changes will sync when you reconnect.',
    actions: undefined,
    dismissible: false,
  },
};

export const Dismissible: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    return open ? (
      <Banner
        {...args}
        onDismiss={() => {
          args.onDismiss?.();
          setOpen(false);
        }}
      />
    ) : (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Show banner again
      </Button>
    );
  },
};

const jobs = ['Bracket_v3', 'Dental_model_upper', 'Gear_housing', 'Hinge_clip_x8', 'Ring_prototype', 'Drone_arm_left', 'Drone_arm_right', 'Lattice_insole', 'Cable_guide', 'Lens_mount'];

/** Scroll the job list: the banner stays pinned to the top of the scroll container. */
export const Sticky: Story = {
  args: { sticky: true, tone: 'warning', title: 'Form 4 · Studio is low on Grey V5', description: 'About 80 mL left in the cartridge.', actions: undefined },
  render: (args) => (
    <div style={{ height: 'calc(var(--space-24) * 2)', overflow: 'auto', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-card)' }}>
      <Banner {...args} />
      <ul className="pf-text-body-sm" style={{ margin: 0, padding: 'var(--space-2) var(--space-4)', listStyle: 'none' }}>
        {jobs.map((j) => (
          <li key={j} style={{ padding: 'var(--space-2) 0', borderBottom: 'var(--border-width-1) solid var(--color-border-subtle)' }}>
            {j}.form
          </li>
        ))}
      </ul>
    </div>
  ),
};
