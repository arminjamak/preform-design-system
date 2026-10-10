import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AnchorNav, type AnchorNavItem, type AnchorNavProps } from '../components/AnchorNav/AnchorNav';
import { StateMatrix } from './helpers/StateMatrix';

type Section = { key: string; label: string; level?: 1 | 2 | 3; body: string[] };

const sections: Section[] = [
  {
    key: 'orientation',
    label: 'Orientation',
    body: [
      'Tilt flat parts 10–20° from the build platform so each layer peels gradually and suction forces stay low.',
      'Keep cosmetic faces pointing away from the platform: every support touchpoint leaves a small nub that needs sanding.',
    ],
  },
  {
    key: 'supports',
    label: 'Supports',
    body: ['Auto-generate supports after orientation. PreForm places touchpoints on every minimum and on overhangs past the self-supporting angle.'],
  },
  {
    key: 'density',
    label: 'Density & touchpoint size',
    level: 2,
    body: [
      'Density 1.00 with 0.40 mm touchpoints suits most Standard resins. Raise density for heavy parts in Tough 2000 or Rigid 10K.',
      'Smaller touchpoints are easier to remove but may let thin features peel off the supports mid-print.',
    ],
  },
  {
    key: 'internal',
    label: 'Internal supports',
    level: 2,
    body: ['Enable internal supports for hollow shells and enclosed cavities. Leave them off for open housings to save resin and post-processing time.'],
  },
  {
    key: 'mini-rafts',
    label: 'Mini rafts',
    level: 3,
    body: ['Mini rafts replace the full raft under each support cluster: faster to remove, but less forgiving on a worn build platform.'],
  },
  {
    key: 'layout',
    label: 'Layout',
    body: [
      'Auto Layout packs models on the platform with a 1 mm minimum spacing. Group parts of similar height to balance peel forces across the tank.',
      'Keep models away from the tank edges where the resin film is thinnest.',
    ],
  },
  {
    key: 'printability',
    label: 'Printability',
    body: ['Check the Printability panel for unsupported minima, cups and thin walls under 0.6 mm before sending the job.'],
  },
  {
    key: 'upload',
    label: 'Upload & print',
    body: [
      'Send the job to Form 4 · Studio over the network or Formlabs Cloud. Estimated print time: 2 h 14 min, 18.4 mL of Grey Resin V5.',
      'Layer height 0.05 mm. The printer will check the resin tank and cartridge before starting.',
    ],
  },
];

const headingStyle = (level = 1) =>
  level === 1 ? 'pf-text-title-sm' : level === 2 ? 'pf-text-body-strong' : 'pf-text-label';

function Demo({ args, stickyHeader = false }: { args: Partial<AnchorNavProps>; stickyHeader?: boolean }) {
  const prefix = useId().replace(/:/g, '');
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  // The sticky header's height (a token) becomes the scroll offset.
  const [headerOffset, setHeaderOffset] = useState(0);
  useLayoutEffect(() => setHeaderOffset(headerRef.current?.offsetHeight ?? 0), [stickyHeader]);
  const items: AnchorNavItem[] = sections.map((s) => ({ id: `${prefix}-${s.key}`, label: s.label, level: s.level }));
  return (
    <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
      <div
        ref={scrollRef}
        tabIndex={0}
        aria-label="Print preparation guide"
        style={{
          position: 'relative',
          width: 'var(--size-layout-dialog-md)',
          height: 'calc(var(--space-24) * 3)',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-bg-surface)',
          boxShadow: 'var(--elevation-card)',
        }}
      >
        {stickyHeader && (
          <div
            ref={headerRef}
            className="pf-text-label"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 'var(--z-index-sticky)',
              display: 'flex',
              alignItems: 'center',
              height: 'var(--size-control-lg)',
              paddingInline: 'var(--space-4)',
              background: 'var(--color-bg-subtle)',
              borderBottom: 'var(--border-width-1) solid var(--color-border-subtle)',
            }}
          >
            Print preparation guide
          </div>
        )}
        <div style={{ padding: 'var(--space-4)', paddingBottom: 'var(--space-24)' }}>
          {sections.map((s) => (
            <section key={s.key} id={`${prefix}-${s.key}`} style={{ marginBottom: 'var(--space-6)', outline: 'none' }}>
              <h3 className={headingStyle(s.level)} style={{ margin: '0 0 var(--space-2)' }}>
                {s.label}
              </h3>
              {s.body.map((p) => (
                <p key={p} className="pf-text-body-sm" style={{ margin: '0 0 var(--space-2)', color: 'var(--color-fg-secondary)' }}>
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
      <AnchorNav {...args} offset={stickyHeader ? Math.max(args.offset ?? 0, headerOffset) : args.offset} items={items} scrollContainerRef={scrollRef} style={{ width: 'var(--size-layout-sidebar)' }} />
    </div>
  );
}

const meta = {
  title: 'Components/Navigation/AnchorNav',
  component: AnchorNav,
  tags: ['expanded'],
  args: { items: [], title: 'On this page', offset: 0, onActiveChange: fn() },
  argTypes: {
    items: { control: false, description: 'Generated per story so section ids stay unique on the docs page.' },
    scrollContainerRef: { control: false },
    offset: { control: { type: 'number', min: 0, step: 4 } },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Anchor navigation / table of contents for long settings pages and guides. Tracks the visible section with IntersectionObserver (window or a scroll container), smooth-scrolls on click (instant under reduced motion) and marks the active item with an accent rail (`--color-fg-accent`).',
      },
    },
  },
  render: (args) => <Demo args={args} />,
} satisfies Meta<typeof AnchorNav>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithStickyHeader: Story = {
  name: 'Offset for a sticky header',
  render: (args) => <Demo args={args} stickyHeader />,
};

export const CustomTitle: Story = {
  name: 'Custom title',
  args: { title: 'Contents' },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={(p) =>
        p.disabled ? (
          <span className="pf-text-caption" style={{ color: 'var(--color-fg-faint)' }}>n/a</span>
        ) : (
          <AnchorNav
            title="On this page"
            data-state={p['data-state']}
            items={[
              { id: 'state-demo-supports', label: 'Supports' },
              { id: 'state-demo-density', label: 'Density', level: 2 },
            ]}
            style={{ width: 'var(--size-field-lg)' }}
          />
        )
      }
    />
  ),
};
