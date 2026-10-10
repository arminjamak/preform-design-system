import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import {
  BoxIcon,
  CopyIcon,
  FileBoxIcon,
  LayersIcon,
  LayoutGridIcon,
  MoonIcon,
  PrinterIcon,
  RotateCwIcon,
  RulerIcon,
  SearchIcon,
  SendIcon,
  SparklesIcon,
  TowerControlIcon,
  WrenchIcon,
  DropletIcon,
} from 'lucide-react';
import { CommandPalette, ShortcutKeys, useCommandPalette, type Command } from '../components/CommandPalette/CommandPalette';
import { Button } from '../components/Button/Button';

const frame: CSSProperties = {
  position: 'relative',
  width: '100%',
  minHeight: 'calc(var(--size-layout-dialog-lg) + var(--space-12))',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-bg-canvas)',
  display: 'grid',
  placeItems: 'center',
};

const run = fn();
const COMMANDS: Command[] = [
  { id: 'orient', group: 'Actions', label: 'Auto-orient', icon: <RotateCwIcon />, keywords: ['rotate', 'angle'], onRun: run },
  { id: 'supports', group: 'Actions', label: 'Auto-generate supports', icon: <TowerControlIcon />, shortcut: ['⌘', 'G'], keywords: ['touchpoints', 'raft'], onRun: run },
  { id: 'layout', group: 'Actions', label: 'Auto-layout', icon: <LayoutGridIcon />, shortcut: ['⌘', 'L'], keywords: ['arrange', 'pack', 'nest'], onRun: run },
  { id: 'repair', group: 'Actions', label: 'Repair mesh', icon: <WrenchIcon />, keywords: ['fix', 'holes', 'manifold'], onRun: run },
  { id: 'duplicate', group: 'Actions', label: 'Duplicate selection', icon: <CopyIcon />, shortcut: ['⌘', 'D'], onRun: run },
  { id: 'hollow', group: 'Actions', label: 'Hollow model', icon: <BoxIcon />, keywords: ['shell', 'drain'], disabled: true, hint: 'Select one model', onRun: run },
  { id: 'send', group: 'Actions', label: 'Send to printer', icon: <SendIcon />, shortcut: ['⌘', 'P'], keywords: ['upload', 'start', 'print'], onRun: run },
  { id: 'm-arch', group: 'Models', label: 'Dental_Arch_Upper.stl', icon: <FileBoxIcon />, hint: '12.4 MB', onRun: run },
  { id: 'm-bracket', group: 'Models', label: 'Bracket_v3.form', icon: <FileBoxIcon />, hint: '× 6', onRun: run },
  { id: 'm-turbine', group: 'Models', label: 'Turbine_Blade.obj', icon: <FileBoxIcon />, hint: '38.1 MB', onRun: run },
  { id: 'm-ring', group: 'Models', label: 'Ring_Setting_Sizes.3mf', icon: <FileBoxIcon />, hint: '2.2 MB', onRun: run },
  { id: 's-layer', group: 'Settings', label: 'Layer height', icon: <LayersIcon />, hint: '0.050 mm', keywords: ['resolution', 'z'], onRun: run },
  { id: 's-material', group: 'Settings', label: 'Material', icon: <DropletIcon />, hint: 'Grey V5', keywords: ['resin', 'cartridge'], onRun: run },
  { id: 's-printer', group: 'Settings', label: 'Printer', icon: <PrinterIcon />, hint: 'Form 4 · Ostrich-Fierce', onRun: run },
  { id: 's-units', group: 'Settings', label: 'Units', icon: <RulerIcon />, hint: 'Millimetres', keywords: ['inches', 'mm'], onRun: run },
  { id: 's-theme', group: 'Settings', label: 'Dark theme', icon: <MoonIcon />, keywords: ['appearance', 'night'], onRun: run },
  { id: 's-whatsnew', group: 'Settings', label: "What's new in PreForm 3.45", icon: <SparklesIcon />, keywords: ['release notes', 'changelog'], onRun: run },
];

const meta = {
  title: 'Components/Overlays/CommandPalette',
  component: CommandPalette,
  tags: ['expanded'],
  args: {
    open: true,
    onOpenChange: fn(),
    commands: COMMANDS,
    placeholder: 'Search actions, models and settings…',
    defaultQuery: '',
    recentIds: ['supports', 'm-arch'],
    maxRecent: 5,
    groupOrder: ['Actions', 'Models', 'Settings'],
    label: 'Command palette',
    inline: true,
  },
  argTypes: {
    commands: { control: false },
    recentIds: { control: 'object' },
    groupOrder: { control: 'object' },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Command palette, search overlay and command search in one: ⌘K / Ctrl+K (via `useCommandPalette`) opens a top-anchored dialog with a combobox input and grouped results (Recent, Actions, Models, Settings) with icons and shortcut key caps. ↑/↓ move, Enter runs, Esc clears then closes. Active row uses `--color-bg-accent-subtle`; key caps use `--color-bg-subtle` with a `--border-width-2` base.',
      },
    },
  },
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    return (
      <div style={frame}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <CommandPalette {...args} open={open} onOpenChange={(o) => update({ open: o })} />
        </div>
        {!open && (
          <Button variant="outline" style={{ position: 'relative' }} iconStart={<SearchIcon strokeWidth={2.4} />} onClick={() => update({ open: true })}>
            Search <ShortcutKeys shortcut={['⌘', 'K']} />
          </Button>
        )}
      </div>
    );
  },
} satisfies Meta<typeof CommandPalette>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Filtered: Story = { args: { defaultQuery: 'sup' } };

export const EmptyState: Story = { args: { defaultQuery: 'castable wax' } };

export const NoRecent: Story = { args: { recentIds: [] } };

/** Press ⌘K / Ctrl+K anywhere in the canvas. The palette portals to <body> here, as in the app. */
export const WithHotkey: Story = {
  args: { inline: false, recentIds: undefined },
  render: function Render(args) {
    const palette = useCommandPalette();
    return (
      <div style={frame}>
        <div className="sb-stack" style={{ alignItems: 'center' }}>
          <Button variant="outline" iconStart={<SearchIcon strokeWidth={2.4} />} onClick={palette.toggle}>
            Search PreForm <ShortcutKeys shortcut={palette.shortcut} />
          </Button>
          <p className="pf-text-body-sm" style={{ color: 'var(--color-fg-muted)' }}>
            Press {palette.shortcut.join(' ')} to open. Commands you run appear under Recent.
          </p>
        </div>
        <CommandPalette {...args} open={palette.open} onOpenChange={palette.onOpenChange} />
      </div>
    );
  },
};
