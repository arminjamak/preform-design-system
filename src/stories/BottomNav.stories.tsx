import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { FolderIcon, HomeIcon, ListOrderedIcon, PrinterIcon, UserIcon } from 'lucide-react';
import { BottomNav, BottomNavButton } from '../components/BottomNav/BottomNav';
import { StateMatrix } from './helpers/StateMatrix';

const items = [
  { value: 'home', label: 'Home', icon: <HomeIcon strokeWidth={2} /> },
  { value: 'printers', label: 'Printers', icon: <PrinterIcon strokeWidth={2} />, badge: 1 },
  { value: 'queue', label: 'Queue', icon: <ListOrderedIcon strokeWidth={2} />, badge: 3 },
  { value: 'library', label: 'Library', icon: <FolderIcon strokeWidth={2} /> },
  { value: 'account', label: 'Account', icon: <UserIcon strokeWidth={2} /> },
];

const meta = {
  title: 'Components/Navigation/BottomNav',
  component: BottomNav,
  tags: ['expanded'],
  args: { items, value: 'queue', onChange: fn(), label: 'Primary' },
  argTypes: {
    value: { control: 'inline-radio', options: items.map((i) => i.value) },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state (2nd item)' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Mobile bottom bar for the PreForm companion views (printer status, queue, library) with 3–5 destinations. Each item stacks the icon over the label like a ToolRail button; the active item turns `--color-fg-accent` on a `--color-bg-accent-selected` pill, and counts use a solid danger Badge. Bottom padding adds `env(safe-area-inset-bottom)` to `--space-1`. Left/Right arrows move between items.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return (
      <div style={{ width: 'var(--size-layout-dialog-md)', maxWidth: '100%' }}>
        <BottomNav
          {...args}
          value={value}
          onChange={(v) => {
            args.onChange(v);
            update({ value: v });
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof BottomNav>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ThreeDestinations: Story = {
  args: { items: items.filter((i) => ['home', 'queue', 'account'].includes(i.value)), value: 'home' },
};

export const WithoutBadges: Story = {
  args: { items: items.map((i) => ({ ...i, badge: undefined })), value: 'printers' },
};

export const LargeCount: Story = {
  name: 'Large count (99+)',
  args: { items: items.map((i) => (i.value === 'queue' ? { ...i, badge: 128 } : i)) },
};

export const InPhoneFrame: Story = {
  name: 'In a phone frame',
  parameters: { controls: { disable: true } },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 'var(--size-layout-dialog-md)',
          maxWidth: '100%',
          height: 'var(--size-layout-dialog-lg)',
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-bg-panel)',
          boxShadow: 'var(--elevation-panel)',
        }}
      >
        <div className="sb-stack" style={{ flex: 1, padding: 'var(--space-4)' }}>
          <span className="pf-text-title-sm">Print queue</span>
          <span className="pf-text-body-sm" style={{ color: 'var(--color-fg-muted)' }}>
            3 jobs waiting · Form 4L · Lab is printing Dental Arch Set (layer 412 of 1,080)
          </span>
        </div>
        <BottomNav {...args} value={value} onChange={(v) => update({ value: v })} />
      </div>
    );
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'Idle', render: (p) => <BottomNavButton icon={<FolderIcon strokeWidth={2} />} label="Library" {...p} /> },
        { label: 'Active', render: (p) => <BottomNavButton active icon={<ListOrderedIcon strokeWidth={2} />} label="Queue" {...p} /> },
        { label: 'Badge', render: (p) => <BottomNavButton badge={3} icon={<PrinterIcon strokeWidth={2} />} label="Printers" {...p} /> },
      ]}
    />
  ),
};
