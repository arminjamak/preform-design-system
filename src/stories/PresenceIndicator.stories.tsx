import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarWithPresence, PresenceIndicator, type PresenceStatus } from '../components/PresenceIndicator/PresenceIndicator';

const STATUSES: PresenceStatus[] = ['online', 'away', 'busy', 'offline'];

const TEAM: Array<{
  name: string;
  status: PresenceStatus;
  lastActive?: string;
}> = [
  { name: 'Armin Jamak', status: 'online' },
  { name: 'Priya Natarajan', status: 'away', lastActive: '5m ago' },
  { name: 'Diego Alvarez', status: 'busy' },
  { name: 'Mei Chen', status: 'offline', lastActive: '2h ago' },
];

const meta = {
  title: 'Components/Collaboration/PresenceIndicator',
  component: PresenceIndicator,
  tags: ['expanded'],
  args: {
    status: 'online',
    size: 'md',
    ring: 'surface',
    lastActive: '',
    showLabel: false,
    decorative: false,
  },
  argTypes: {
    status: { control: 'inline-radio', options: STATUSES },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    ring: {
      control: 'inline-radio',
      options: ['surface', 'panel', 'inverse', 'none'],
    },
    lastActive: { control: 'text' },
    label: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Presence dot for teammates on a shared PreForm project. Colour comes from `--color-status-success|warning|danger` and `--color-fg-muted`; shape also changes (away notch, busy bar, hollow offline) and the status is always announced, so it never relies on colour alone. The ring uses the surface token it sits on. `AvatarWithPresence` overlays it on an `Avatar`.',
      },
    },
  },
} satisfies Meta<typeof PresenceIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: ({ lastActive, ...args }) => <PresenceIndicator {...args} lastActive={lastActive || undefined} />,
};

export const Statuses: Story = {
  render: (args) => (
    <div className="sb-stack">
      {STATUSES.map((st) => (
        <PresenceIndicator key={st} {...args} status={st} showLabel />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row">
      <PresenceIndicator {...args} size="sm" />
      <PresenceIndicator {...args} size="md" />
      <PresenceIndicator {...args} size="lg" />
    </div>
  ),
};

export const WithLastActive: Story = {
  name: 'With "Active 5m ago"',
  render: () => (
    <div className="sb-stack">
      {TEAM.map((m) => (
        <div key={m.name} className="sb-row" style={{ gap: 'var(--space-2)' }}>
          <span className="pf-text-label" style={{ width: 'var(--size-field-lg)' }}>
            {m.name}
          </span>
          <PresenceIndicator status={m.status} lastActive={m.lastActive} size="sm" ring="none" showLabel />
        </div>
      ))}
    </div>
  ),
};

export const OnAvatar: Story = {
  name: 'AvatarWithPresence',
  render: () => (
    <div className="sb-stack">
      <div className="sb-row">
        {TEAM.map((m) => (
          <AvatarWithPresence key={m.name} name={m.name} status={m.status} lastActive={m.lastActive} size="md" />
        ))}
      </div>
      <div className="sb-row">
        <AvatarWithPresence name="Priya Natarajan" status="online" size="xs" />
        <AvatarWithPresence name="Priya Natarajan" status="online" size="sm" />
        <AvatarWithPresence name="Priya Natarajan" status="online" size="md" />
        <AvatarWithPresence name="Priya Natarajan" status="online" size="lg" />
      </div>
    </div>
  ),
};

export const OnInverse: Story = {
  name: 'On the app bar',
  render: () => (
    <div
      className="sb-row"
      style={{
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg-inverse)',
        color: 'var(--color-fg-on-inverse)',
      }}
    >
      {TEAM.map((m) => (
        <AvatarWithPresence key={m.name} name={m.name} status={m.status} lastActive={m.lastActive} size="sm" ring="inverse" />
      ))}
    </div>
  ),
};
