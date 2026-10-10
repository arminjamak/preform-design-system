import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button/Button';
import { LiveRegion, useAnnounce, type Politeness } from '../components/LiveRegion/LiveRegion';

const meta = {
  title: 'Components/Feedback/LiveRegion',
  component: LiveRegion,
  tags: ['expanded'],
  args: { politeness: 'polite', atomic: true, visible: true, children: 'Supports generated for 3 models' },
  argTypes: {
    politeness: { control: 'inline-radio', options: ['polite', 'assertive', 'off'] },
    children: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A visually hidden `aria-live` region, plus `useAnnounce()` for one-off messages from anywhere ("Supports generated", "Slicing complete"). `polite` waits its turn, `assertive` interrupts and is for failures only. `visible` exists for docs and debugging; the Playground turns it on so you can see the text.',
      },
    },
  },
} satisfies Meta<typeof LiveRegion>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

type LogEntry = { id: number; time: string; message: string; politeness: Politeness };

function AnnounceDemo() {
  const announce = useAnnounce();
  const [log, setLog] = useState<LogEntry[]>([]);
  const say = (message: string, politeness: Politeness) => {
    announce(message, politeness);
    setLog((l) => [{ id: Date.now(), time: new Date().toLocaleTimeString(), message, politeness }, ...l].slice(0, 6));
  };
  return (
    <div className="sb-stack" style={{ width: 'var(--size-layout-dialog-md)' }}>
      <div className="sb-row">
        <Button variant="primary" onClick={() => say('Supports generated', 'polite')}>
          Generate supports
        </Button>
        <Button variant="outline" onClick={() => say('Slicing complete. 1,412 layers, 2 hours 38 minutes.', 'polite')}>
          Slice
        </Button>
        <Button variant="danger" onClick={() => say('Print failed on Form 4: resin tank not detected.', 'assertive')}>
          Simulate failure
        </Button>
      </div>
      <section aria-label="Announcement log" style={{ width: '100%' }}>
        <p className="pf-text-caption" style={{ color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: 'var(--font-letter-spacing-wide)', marginBottom: 'var(--space-1)' }}>
          Announced to screen readers
        </p>
        <ol
          className="pf-text-mono"
          style={{ margin: 0, padding: 'var(--space-2) var(--space-3)', listStyle: 'none', minHeight: 'var(--space-16)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--elevation-card)' }}
        >
          {log.length === 0 && <li style={{ color: 'var(--color-fg-faint)' }}>Nothing announced yet.</li>}
          {log.map((e) => (
            <li key={e.id} style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <span style={{ color: 'var(--color-fg-muted)' }}>{e.time}</span>
              <span style={{ color: e.politeness === 'assertive' ? 'var(--color-status-danger-strong)' : 'var(--color-fg-default)' }}>[{e.politeness}]</span>
              <span>{e.message}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/** `useAnnounce()` writes to shared hidden regions on `document.body`. The log mirrors each message for sighted users. */
export const UseAnnounce: Story = {
  parameters: { controls: { disable: true } },
  render: () => <AnnounceDemo />,
};

function ControlledRegionDemo() {
  const [count, setCount] = useState(0);
  return (
    <div className="sb-stack">
      <Button variant="outline" onClick={() => setCount((c) => c + 1)}>
        Add model to build platform
      </Button>
      <LiveRegion visible>{count === 0 ? 'Build platform is empty' : `${count} model${count === 1 ? '' : 's'} on the build platform`}</LiveRegion>
    </div>
  );
}

/** A `LiveRegion` component whose children follow state. Shown with `visible` so you can see what is read. */
export const DrivenByState: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ControlledRegionDemo />,
};
