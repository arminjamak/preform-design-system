import type { Meta, StoryObj } from '@storybook/react-vite';
import { BellIcon, ListOrderedIcon, PrinterIcon } from 'lucide-react';
import { IconButton } from '../components/IconButton/IconButton';
import { NotificationBadge } from '../components/NotificationBadge/NotificationBadge';
import { StateMatrix } from './helpers/StateMatrix';

const TONES = ['danger', 'accent', 'info', 'success', 'warning', 'neutral'] as const;

const bell = <IconButton label="Printer notifications" icon={<BellIcon strokeWidth={2} />} size="md" />;

const meta = {
  title: 'Components/Feedback/NotificationBadge',
  component: NotificationBadge,
  tags: ['expanded'],
  args: { count: 3, max: 99, dot: false, showZero: false, invisible: false, tone: 'danger', label: '3 unread printer notifications', children: bell },
  argTypes: {
    tone: { control: 'select', options: TONES },
    count: { control: { type: 'number', min: 0 } },
    max: { control: { type: 'number', min: 1 } },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Pins an unread count or a dot to the top-right of its child (the bell in the top bar, the queue tab). Counts above `max` show as `99+`; the visual badge is `aria-hidden` and `label` is read instead. Solid fills use `--color-status-*`, with a `--color-bg-surface` cut-out ring.',
      },
    },
  },
} satisfies Meta<typeof NotificationBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Counts: Story = {
  parameters: { controls: { include: ['tone'] } },
  render: (args) => (
    <div className="sb-row" style={{ gap: 'var(--space-6)' }}>
      <NotificationBadge {...args} count={0} showZero label="No unread notifications">{bell}</NotificationBadge>
      <NotificationBadge {...args} count={3} label="3 unread notifications">{bell}</NotificationBadge>
      <NotificationBadge {...args} count={12} label="12 unread notifications">{bell}</NotificationBadge>
      <NotificationBadge {...args} count={150} label="More than 99 unread notifications">{bell}</NotificationBadge>
    </div>
  ),
};

export const Dot: Story = {
  args: { dot: true, tone: 'accent', label: 'New firmware available', children: <IconButton label="Printers" icon={<PrinterIcon strokeWidth={2} />} size="md" /> },
};

export const Tones: Story = {
  parameters: { controls: { include: ['count', 'dot'] } },
  render: (args) => (
    <div className="sb-row" style={{ gap: 'var(--space-6)' }}>
      {TONES.map((t) => (
        <NotificationBadge key={t} {...args} tone={t} label={`${args.count} ${t} notifications`}>
          <IconButton label={`Queue (${t})`} icon={<ListOrderedIcon strokeWidth={2} />} size="md" variant="outline" />
        </NotificationBadge>
      ))}
    </div>
  ),
};

/** The badge stays pinned while the wrapped bell goes through its interaction states. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={(p) => (
        <NotificationBadge {...args} count={5} label="5 unread notifications">
          <IconButton label="Printer notifications" icon={<BellIcon strokeWidth={2} />} size="md" {...p} />
        </NotificationBadge>
      )}
    />
  ),
};
