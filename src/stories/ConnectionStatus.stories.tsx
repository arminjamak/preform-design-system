import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button/Button';
import { ConnectionStatus, type Connection } from '../components/ConnectionStatus/ConnectionStatus';
import { StateMatrix } from './helpers/StateMatrix';

const STATUSES: Connection[] = ['online', 'connecting', 'degraded', 'offline'];

const meta = {
  title: 'Components/Feedback/ConnectionStatus',
  component: ConnectionStatus,
  tags: ['expanded'],
  args: { status: 'online', name: 'Form 4', compact: false, size: 'md', tooltipPlacement: 'top', live: false },
  argTypes: {
    status: { control: 'inline-radio', options: STATUSES },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    tooltipPlacement: { control: 'inline-radio', options: ['top', 'bottom'] },
    name: { control: 'text' },
    statusLabel: { control: 'text' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state (compact)' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Dot-and-label indicator for printer and cloud connections ("Form 4 · Online"). Online, degraded and connecting use `--color-status-success`, `--color-status-warning` and the accent (with a reduced-motion-safe pulse); offline is a hollow `--color-fg-faint` ring. `compact` shows only a focusable dot with a `Tooltip`.',
      },
    },
  },
} satisfies Meta<typeof ConnectionStatus>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllStatuses: Story = {
  parameters: { controls: { include: ['size', 'compact'] } },
  render: (args) => (
    <div className="sb-stack">
      {STATUSES.map((st) => (
        <ConnectionStatus key={st} {...args} status={st} name="Form 4 · Studio" />
      ))}
    </div>
  ),
};

/** Dot only. Hover or Tab to a dot to read its tooltip. */
export const Compact: Story = {
  parameters: { controls: { include: ['size', 'tooltipPlacement'] } },
  render: (args) => (
    <div className="sb-row" style={{ paddingTop: 'var(--space-8)' }}>
      {STATUSES.map((st, i) => (
        <ConnectionStatus key={st} {...args} compact status={st} name={['Form 4', 'Form 4B', 'Form 3+', 'Form 3L'][i]} />
      ))}
    </div>
  ),
};

/** Status text only, e.g. cloud sync in the top bar. */
export const WithoutName: Story = { args: { name: undefined, status: 'degraded', statusLabel: 'Sync delayed' } };

function ReconnectDemo() {
  const [status, setStatus] = useState<Connection>('offline');
  useEffect(() => {
    if (status !== 'connecting') return;
    const t = window.setTimeout(() => setStatus('online'), 2000);
    return () => window.clearTimeout(t);
  }, [status]);
  return (
    <div className="sb-stack">
      <ConnectionStatus status={status} name="Form 4 · Studio" live />
      <div className="sb-row">
        <Button variant="outline" onClick={() => setStatus('connecting')} disabled={status !== 'offline'}>
          Reconnect
        </Button>
        <Button variant="ghost" onClick={() => setStatus('offline')} disabled={status === 'offline'}>
          Disconnect
        </Button>
      </div>
    </div>
  );
}

/** `live` makes the indicator a polite status region, so the change to "Online" is announced. */
export const LiveReconnect: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ReconnectDemo />,
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ paddingTop: 'var(--space-8)' }}>
      <StateMatrix render={(p) => <ConnectionStatus status="online" name="Form 4" compact data-state={p['data-state']} />} />
    </div>
  ),
};
