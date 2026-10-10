import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CopyIcon, LayoutGridIcon, Rotate3dIcon, Trash2Icon } from 'lucide-react';
import { Kbd, ShortcutList, formatShortcut, type ShortcutListItem } from '../components/Kbd/Kbd';
import { MenuList } from '../components/Menu/Menu';
import { Tooltip } from '../components/Tooltip/Tooltip';
import { IconButton } from '../components/IconButton/IconButton';

const meta = {
  title: 'Components/Interaction/Kbd',
  component: Kbd,
  tags: ['expanded'],
  args: { keys: 'mod+shift+z', platform: 'auto', size: 'sm', variant: 'outline', separator: undefined },
  argTypes: {
    keys: { control: 'text', description: 'Combo joined with "+". `mod` is ⌘ on macOS and Ctrl elsewhere; also shift, alt, ctrl, enter, esc, delete, tab, space and arrows.' },
    platform: { control: 'inline-radio', options: ['auto', 'mac', 'pc'] },
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md'] },
    variant: { control: 'inline-radio', options: ['outline', 'subtle', 'inverse'] },
    separator: { control: 'inline-radio', options: [undefined, true, false] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Keyboard shortcut hint: key caps with platform-aware modifiers (⌘ ⇧ ⌥ on macOS, Ctrl / Shift / Alt elsewhere) and a spoken label for screen readers. `outline` caps sit in text and panels, `subtle` in menus and `inverse` on tooltips. `formatShortcut()` gives the same text for string-only slots. `ShortcutList` lays out action → keys.',
      },
    },
  },
} satisfies Meta<typeof Kbd>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const combos = ['mod+z', 'mod+shift+z', 'mod+d', 'delete', 'enter', 'esc', 'shift+click', 'alt+up'];

export const Platforms: Story = {
  parameters: { controls: { include: ['size', 'variant'] } },
  render: (args) => (
    <table className="sb-matrix">
      <thead>
        <tr>
          <th className="pf-text-caption">Combo</th>
          <th className="pf-text-caption">macOS</th>
          <th className="pf-text-caption">Windows / Linux</th>
        </tr>
      </thead>
      <tbody>
        {combos.map((c) => (
          <tr key={c}>
            <td className="pf-text-mono">{c}</td>
            <td>
              <Kbd {...args} keys={c} platform="mac" />
            </td>
            <td>
              <Kbd {...args} keys={c} platform="pc" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row">
      <Kbd {...args} size="xs" />
      <Kbd {...args} size="sm" />
      <Kbd {...args} size="md" />
    </div>
  ),
};

export const Variants: Story = {
  parameters: { controls: { include: ['keys', 'platform', 'size'] } },
  render: (args) => (
    <div className="sb-row">
      <Kbd {...args} variant="outline" />
      <Kbd {...args} variant="subtle" />
      <span style={{ display: 'inline-flex', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-inverse)' }}>
        <Kbd {...args} variant="inverse" />
      </span>
    </div>
  ),
};

export const InText: Story = {
  parameters: { controls: { include: ['platform'] } },
  render: (args) => (
    <p className="pf-text-body" style={{ maxWidth: 'var(--size-layout-dialog-md)', color: 'var(--color-fg-secondary)' }}>
      Select every model with <Kbd keys="mod+a" platform={args.platform} />, then press <Kbd keys="mod+d" platform={args.platform} /> to duplicate them onto the build platform. Hold{' '}
      <Kbd keys="shift" platform={args.platform} /> while rotating to snap to 15° steps, and press <Kbd keys="enter" platform={args.platform} /> to confirm the orientation.
    </p>
  ),
};

export const InMenusAndTooltips: Story = {
  parameters: { controls: { include: ['platform'] } },
  decorators: [(S) => <div style={{ paddingTop: 'var(--space-10)' }}><S /></div>],
  render: (args) => (
    <div className="sb-row" style={{ alignItems: 'flex-start', gap: 'var(--space-8)' }}>
      <div style={{ width: 'var(--size-layout-sidebar)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-popover)' }}>
        <MenuList
          items={[
            { label: 'Duplicate', icon: <CopyIcon strokeWidth={2.2} />, shortcut: formatShortcut('mod+d', args.platform), onSelect: fn() },
            { label: 'Orient', icon: <Rotate3dIcon strokeWidth={2.2} />, shortcut: formatShortcut('mod+shift+o', args.platform), onSelect: fn() },
            { label: 'Lay out', icon: <LayoutGridIcon strokeWidth={2.2} />, shortcut: formatShortcut('mod+l', args.platform), onSelect: fn() },
            { type: 'separator' },
            { label: 'Delete', icon: <Trash2Icon strokeWidth={2.2} />, shortcut: formatShortcut('delete', args.platform), onSelect: fn(), danger: true },
          ]}
        />
      </div>
      <Tooltip
        open
        content={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            Lay out <Kbd keys="mod+l" platform={args.platform} size="xs" variant="inverse" />
          </span>
        }
      >
        <IconButton label="Lay out" icon={<LayoutGridIcon strokeWidth={2.2} />} variant="floating" size="lg" shape="circle" />
      </Tooltip>
    </div>
  ),
};

const shortcuts: ShortcutListItem[] = [
  { group: 'Edit', action: 'Undo', shortcut: 'mod+z' },
  { group: 'Edit', action: 'Redo', shortcut: ['mod+shift+z', 'ctrl+y'] },
  { group: 'Edit', action: 'Duplicate selection', shortcut: 'mod+d' },
  { group: 'Edit', action: 'Delete selection', shortcut: ['delete', 'backspace'] },
  { group: 'Prepare', action: 'Orient', description: 'Minimise supports and peel forces', shortcut: 'mod+shift+o' },
  { group: 'Prepare', action: 'Generate supports', shortcut: 'mod+shift+g' },
  { group: 'Prepare', action: 'Lay out models', shortcut: 'mod+l' },
  { group: 'View', action: 'Zoom to fit', shortcut: 'f' },
  { group: 'View', action: 'Top view', shortcut: '7' },
];

export const ShortcutListStory: Story = {
  name: 'ShortcutList',
  parameters: { controls: { include: ['platform', 'size', 'variant'] } },
  render: (args) => (
    <div style={{ width: 'var(--size-layout-dialog-md)', padding: 'var(--space-4)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--elevation-card)' }}>
      <ShortcutList title="Keyboard shortcuts" items={shortcuts} platform={args.platform} size={args.size} variant={args.variant} />
    </div>
  ),
};
