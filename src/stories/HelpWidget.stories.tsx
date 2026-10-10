import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { HelpWidget, type HelpArticle } from '../components/HelpWidget/HelpWidget';

const frame: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 'calc(var(--size-layout-dialog-lg) + var(--space-20))',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-bg-canvas)',
  overflow: 'hidden',
};

const ARTICLES: HelpArticle[] = [
  { id: 'supports', title: 'Generating and editing supports', description: 'Density, touchpoint size and internal supports.', href: 'https://support.formlabs.com', keywords: ['touchpoint', 'raft'] },
  { id: 'orient', title: 'Orienting models for print success', description: 'Minimise cross-sections and protect cosmetic faces.', href: 'https://support.formlabs.com', keywords: ['rotate', 'angle'] },
  { id: 'failed', title: 'Troubleshooting failed prints', description: 'Delamination, missing parts and cloudy tanks.', href: 'https://support.formlabs.com', keywords: ['fail', 'adhesion'] },
  { id: 'tank', title: 'When to replace your resin tank', description: 'Reading tank layer counts in Dashboard.', href: 'https://support.formlabs.com', keywords: ['lt', 'film'] },
  { id: 'hollow', title: 'Hollowing and drain holes', description: 'Save resin on large solid parts.', onSelect: fn(), keywords: ['shell', 'drain'] },
];

const meta = {
  title: 'Components/Overlays/HelpWidget',
  component: HelpWidget,
  tags: ['expanded'],
  args: {
    open: true,
    onOpenChange: fn(),
    title: 'Help & resources',
    articles: ARTICLES,
    onSearch: fn(),
    onContactSupport: fn(),
    onShowShortcuts: fn(),
    shortcutsHint: ['?'],
    whatsNew: { title: 'PreForm 3.45', description: 'Faster supports, Form 4L tank tracking and 12 fixes.', count: 3, onSelect: fn() },
    inline: true,
  },
  argTypes: {
    open: { control: 'boolean' },
    articles: { control: 'object' },
    whatsNew: { control: 'object' },
    shortcutsHint: { control: 'object' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state (launcher)' },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Floating help launcher pinned bottom-right (`--size-control-xl` accent disc, `--elevation-panel`). It opens a non-modal panel with article search, suggested articles, a What\'s new item, a Keyboard shortcuts link and Contact support. Escape or the launcher closes it and returns focus; an outside click closes it without moving focus. A red dot on the launcher marks unread release notes.',
      },
    },
  },
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    return (
      <div style={frame}>
        <HelpWidget
          {...args}
          open={open}
          onOpenChange={(o) => {
            args.onOpenChange?.(o);
            update({ open: o });
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof HelpWidget>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Closed: Story = { args: { open: false } };

export const Minimal: Story = { args: { whatsNew: undefined, onShowShortcuts: undefined, articles: ARTICLES.slice(0, 3) } };

export const LauncherStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-row" style={{ gap: 'var(--space-6)', padding: 'var(--space-6)' }}>
      {([undefined, 'hover', 'focus', 'active'] as const).map((state) => (
        <div key={state ?? 'default'} className="sb-stack" style={{ alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 'var(--space-16)', height: 'var(--space-16)' }}>
            <HelpWidget inline open={false} articles={ARTICLES} data-state={state} whatsNew={{ title: 'PreForm 3.45', count: state ? 0 : 2 }} />
          </div>
          <span className="pf-text-caption" style={{ color: 'var(--color-fg-muted)', textTransform: 'uppercase' }}>
            {state ?? 'default'}
          </span>
        </div>
      ))}
    </div>
  ),
};
