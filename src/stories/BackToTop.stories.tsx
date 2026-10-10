import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BackToTop, type BackToTopProps } from '../components/BackToTop/BackToTop';
import { StateMatrix } from './helpers/StateMatrix';

const printers = ['Form 4 · Studio', 'Form 4B · Lab', 'Form 3+ · Workshop'];
const materials = ['Grey Resin V5', 'Tough 2000', 'Rigid 10K', 'Clear V4'];
const models = ['Bracket_v3', 'Chassis_Base', 'Wheel_Hub_x4', 'Gear_Housing', 'Dental_Model_UL', 'Drone_Arm_R'];
const jobs = Array.from({ length: 40 }, (_, i) => ({
  id: 1287 - i,
  model: models[i % models.length],
  printer: printers[i % printers.length],
  material: materials[i % materials.length],
  status: i % 9 === 4 ? 'Failed' : 'Completed',
}));

function JobRows() {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {jobs.map((j) => (
        <li
          key={j.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            padding: 'var(--space-2) var(--space-3)',
            borderBottom: 'var(--border-width-1) solid var(--color-border-subtle)',
          }}
        >
          <span>
            <span className="pf-text-body-strong" style={{ display: 'block' }}>{j.model}</span>
            <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>
              Job {j.id} · {j.printer} · {j.material}
            </span>
          </span>
          <span className="pf-text-label" style={{ color: j.status === 'Failed' ? 'var(--color-status-danger)' : 'var(--color-fg-muted)' }}>
            {j.status}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ContainerDemo(args: BackToTopProps) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      tabIndex={0}
      aria-label="Print history"
      style={{
        width: 'var(--size-layout-dialog-md)',
        height: 'calc(var(--space-24) * 3)',
        overflowY: 'auto',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
        boxShadow: 'var(--elevation-card)',
      }}
    >
      <JobRows />
      <BackToTop {...args} scrollContainerRef={ref} />
    </div>
  );
}

const meta = {
  title: 'Components/Navigation/BackToTop',
  component: BackToTop,
  tags: ['expanded'],
  args: { threshold: 200, label: 'Back to top', position: 'bottom-right', visible: undefined, onClick: fn() },
  argTypes: {
    threshold: { control: { type: 'number', min: 0, step: 50 } },
    position: { control: 'inline-radio', options: ['bottom-right', 'bottom-center'] },
    visible: { control: 'inline-radio', options: [undefined, true, false] },
    scrollContainerRef: { control: false },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Floating circular IconButton (`floating` variant, `--elevation-raised`) that fades in once a scroll container or the window passes `threshold`, then scrolls back to the top (instantly under reduced motion). Used on long print histories and material libraries.',
      },
    },
  },
  render: (args) => <ContainerDemo {...args} />,
} satisfies Meta<typeof BackToTop>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const BottomCenter: Story = { name: 'Bottom center', args: { position: 'bottom-center' } };

export const WindowScroll: Story = {
  name: 'Window scroll',
  parameters: { layout: 'fullscreen', docs: { story: { inline: false, iframeHeight: 400 } } },
  render: (args) => (
    <div style={{ width: '100%' }}>
      <JobRows />
      <BackToTop {...args} />
    </div>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={(p) =>
        p.disabled ? (
          <span className="pf-text-caption" style={{ color: 'var(--color-fg-faint)' }}>n/a</span>
        ) : (
          // A transformed box becomes the containing block for the fixed button, so it renders in place.
          <div style={{ width: 'calc(var(--space-6) + var(--size-control-lg))', height: 'calc(var(--space-6) + var(--size-control-lg))', transform: 'translateZ(0)' }}>
            <BackToTop visible data-state={p['data-state']} />
          </div>
        )
      }
    />
  ),
};
