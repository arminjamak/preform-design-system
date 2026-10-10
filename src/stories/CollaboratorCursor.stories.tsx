import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CollaboratorCursor, CollaboratorLayer, type Collaborator, type CollaboratorRect } from '../components/CollaboratorCursor/CollaboratorCursor';
import { AvatarWithPresence } from '../components/PresenceIndicator/PresenceIndicator';
import { Card } from '../components/Card/Card';
import { Badge } from '../components/Badge/Badge';

/** World units are CSS pixels; multiply by --space-px so no raw lengths appear in styles. */
const world = (n: number) => `calc(var(--space-px) * ${n})`;

const stage = (children: ReactNode, h = 2) => (
  <div
    style={{
      position: 'relative',
      width: 'calc(var(--space-24) * 4)',
      height: `calc(var(--space-24) * ${h})`,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--color-bg-surface)',
      boxShadow: 'var(--elevation-card)',
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

const meta = {
  title: 'Components/Collaboration/CollaboratorCursor',
  component: CollaboratorCursor,
  tags: ['expanded'],
  args: {
    userId: 'priya',
    name: 'Priya Natarajan',
    x: 96,
    y: 56,
    activity: 'Adding supports',
    idle: false,
    hideName: false,
  },
  argTypes: {
    x: { control: { type: 'range', min: 0, max: 360, step: 4 } },
    y: { control: { type: 'range', min: 0, max: 160, step: 4 } },
    colorIndex: { control: 'select', options: [undefined, 1, 2, 3, 4, 5, 6] },
    activity: { control: 'text' },
    selection: { control: 'object' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Remote collaborator pointer on the build platform: an SVG arrow and name pill in the user’s colour (hashed from their id into `--color-chart-series-1…6`), an optional selection box, and a transform transition on `--motion-duration-slow` / `--motion-easing-standard` so updates glide. Idle cursors fade to `--opacity-dimmed`. `CollaboratorLayer` positions many cursors over any content and lists who is present for screen readers.',
      },
    },
  },
  render: (args) => stage(<CollaboratorCursor {...args} activity={args.activity || undefined} />),
} satisfies Meta<typeof CollaboratorCursor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithSelection: Story = {
  args: {
    x: 212,
    y: 92,
    selection: { x: 40, y: 32, width: 168, height: 72 },
    activity: 'Moving Chassis plate',
  },
};

export const Idle: Story = { args: { idle: true } };

export const ColourSlots: Story = {
  name: 'Colour slots',
  render: () =>
    stage(
      <>
        {(['Armin Jamak', 'Priya Natarajan', 'Diego Alvarez', 'Mei Chen', 'Print bot', 'Guest reviewer'] as const).map((name, i) => (
          <CollaboratorCursor
            key={name}
            userId={name}
            name={name}
            colorIndex={(i + 1) as 1 | 2 | 3 | 4 | 5 | 6}
            x={16 + (i % 3) * 124}
            y={24 + Math.floor(i / 3) * 88}
          />
        ))}
      </>,
    ),
};

/* ---------- Live build platform ---------- */

type Model = CollaboratorRect & { id: string; label: string };
const MODELS: Model[] = [
  {
    id: 'chassis',
    label: 'Chassis plate',
    x: 32,
    y: 40,
    width: 168,
    height: 96,
  },
  { id: 'motor', label: 'Motor mount', x: 232, y: 48, width: 112, height: 72 },
  {
    id: 'battery',
    label: 'Battery tray',
    x: 40,
    y: 172,
    width: 132,
    height: 72,
  },
  { id: 'hubs', label: 'Wheel hub ×4', x: 216, y: 160, width: 132, height: 88 },
];
const rect = (id: string) => MODELS.find((m) => m.id === id);

type Step = {
  x: number;
  y: number;
  select?: string;
  idle?: boolean;
  activity?: string;
};
const PATHS: Record<string, { name: string; steps: Step[] }> = {
  priya: {
    name: 'Priya Natarajan',
    steps: [
      { x: 72, y: 70, select: 'chassis', activity: 'Adding supports' },
      { x: 128, y: 96, select: 'chassis', activity: 'Adding supports' },
      { x: 164, y: 64, select: 'chassis', activity: 'Adding supports' },
      { x: 120, y: 120, select: 'chassis', activity: 'Adding supports' },
      { x: 260, y: 196, select: 'hubs', activity: 'Checking hubs' },
      { x: 300, y: 216, select: 'hubs', activity: 'Checking hubs' },
    ],
  },
  diego: {
    name: 'Diego Alvarez',
    steps: [
      { x: 300, y: 30, activity: 'Orienting' },
      { x: 280, y: 86, select: 'motor', activity: 'Rotating 15°' },
      { x: 318, y: 100, select: 'motor', activity: 'Rotating 15°' },
      { x: 250, y: 70, select: 'motor', activity: 'Rotating 15°' },
      { x: 208, y: 30, activity: 'Orienting' },
      { x: 330, y: 132 },
    ],
  },
  mei: {
    name: 'Mei Chen',
    steps: [
      { x: 20, y: 256, activity: 'Reviewing' },
      { x: 96, y: 210, select: 'battery', activity: 'Reviewing' },
      { x: 104, y: 214, select: 'battery', idle: true },
      { x: 104, y: 214, select: 'battery', idle: true },
      { x: 104, y: 214, select: 'battery', idle: true },
      { x: 60, y: 150 },
    ],
  },
};

/** Simulation tick; world time for the fake network feed, not a UI transition duration. */
const TICK = 1100;

function BuildPlatform() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setT((n) => n + 1), TICK);
    return () => window.clearInterval(id);
  }, []);

  const collaborators: Collaborator[] = Object.entries(PATHS).map(([userId, p]) => {
    const step = p.steps[t % p.steps.length];
    return {
      userId,
      name: p.name,
      x: step.x,
      y: step.y,
      selection: step.select ? rect(step.select) : undefined,
      idle: step.idle,
      activity: step.activity,
    };
  });

  const modelStyle = (m: Model): CSSProperties => ({
    position: 'absolute',
    left: world(m.x),
    top: world(m.y),
    width: world(m.width),
    height: world(m.height),
    display: 'flex',
    alignItems: 'flex-end',
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg-muted)',
    border: 'var(--border-width-1) solid var(--color-border-strong)',
    color: 'var(--color-fg-secondary)',
  });

  return (
    <Card variant="elevated" padding="md" style={{ width: 'fit-content' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-half)',
            flex: 1,
          }}
        >
          <span className="pf-text-body-strong">Mini Chassis Kit</span>
          <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>
            Form 4 · Grey V5 · 50 µm layers · 4 parts
          </span>
        </div>
        <Badge tone="success" variant="soft">
          3 editing
        </Badge>
        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
          <AvatarWithPresence name="Priya Natarajan" status="online" size="sm" />
          <AvatarWithPresence name="Diego Alvarez" status="online" size="sm" />
          <AvatarWithPresence name="Mei Chen" status="away" lastActive="just now" size="sm" />
        </div>
      </div>
      <CollaboratorLayer collaborators={collaborators} label="Editing Mini Chassis Kit">
        <div
          role="img"
          aria-label="Build platform with Chassis plate, Motor mount, Battery tray and four wheel hubs"
          style={{
            position: 'relative',
            width: 'calc(var(--space-24) * 4)',
            height: 'calc(var(--space-24) * 3)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-panel)',
            backgroundImage:
              'linear-gradient(var(--color-chart-grid) var(--space-px), transparent var(--space-px)), linear-gradient(to right, var(--color-chart-grid) var(--space-px), transparent var(--space-px))',
            backgroundSize: 'var(--space-6) var(--space-6)',
            border: 'var(--border-width-1) solid var(--color-border-default)',
          }}
        >
          {MODELS.map((m) => (
            <span key={m.id} className="pf-text-label-sm" style={modelStyle(m)}>
              {m.label}
            </span>
          ))}
        </div>
      </CollaboratorLayer>
    </Card>
  );
}

export const LiveBuildPlatform: Story = {
  name: 'Live: build platform',
  parameters: { controls: { disable: true } },
  render: () => <BuildPlatform />,
};
