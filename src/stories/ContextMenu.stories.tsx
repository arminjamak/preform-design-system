import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BoxIcon, CopyIcon, DownloadIcon, EyeOffIcon, Trash2Icon } from 'lucide-react';
import { ContextMenu } from '../components/ContextMenu/ContextMenu';
import { Card } from '../components/Card/Card';
import type { MenuItem } from '../components/Menu/Menu';

const modelItems: MenuItem[] = [
  { label: 'Hide', onSelect: fn(), icon: <EyeOffIcon strokeWidth={2.2} />, shortcut: 'H' },
  { label: 'Duplicate', onSelect: fn(), icon: <CopyIcon strokeWidth={2.2} />, shortcut: '⌘D' },
  { label: 'Export STL', onSelect: fn(), icon: <DownloadIcon strokeWidth={2.2} /> },
  { type: 'separator' },
  { label: 'Delete', onSelect: fn(), icon: <Trash2Icon strokeWidth={2.2} />, shortcut: '⌫', danger: true },
];

function ModelCard({ name, meta }: { name: string; meta: string }) {
  return (
    <Card interactive padding="sm" tabIndex={0} aria-label={`${name}. Right-click or press Shift+F10 for actions`} style={{ width: 'var(--size-field-lg)' }}>
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'var(--space-20)',
          marginBottom: 'var(--space-2)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-panel)',
          color: 'var(--color-fg-muted)',
        }}
      >
        <BoxIcon strokeWidth={1.6} style={{ width: 'var(--size-icon-lg)', height: 'var(--size-icon-lg)' }} />
      </span>
      <span className="pf-text-body-strong" style={{ display: 'block' }}>{name}</span>
      <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>{meta}</span>
    </Card>
  );
}

const meta = {
  title: 'Components/Navigation/ContextMenu',
  component: ContextMenu,
  tags: ['expanded'],
  args: {
    items: modelItems,
    disabled: false,
    label: 'Model actions',
    onOpenChange: fn(),
    children: <ModelCard name="Bracket_v3" meta="Grey Resin V5 · 18.4 mL" />,
  },
  argTypes: {
    items: { control: 'object' },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Right-click menu for models in the viewport, tray rows and file lists. Opens a `MenuList` at the pointer (or at the focused element on Shift+F10 / the ContextMenu key), clamped inside the viewport; closes on Escape, outside click or scroll. Surface uses `--elevation-popover` and `--component-menu-radius`.',
      },
    },
  },
} satisfies Meta<typeof ContextMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ModelGrid: Story = {
  name: 'Model grid',
  render: (args) => (
    <div className="sb-row" style={{ alignItems: 'stretch' }}>
      {[
        ['Bracket_v3', 'Grey Resin V5 · 18.4 mL'],
        ['Chassis_Base', 'Tough 2000 · 42.1 mL'],
        ['Wheel_Hub_x4', 'Rigid 10K · 9.7 mL'],
      ].map(([name, m]) => (
        <ContextMenu key={name} {...args} label={`${name} actions`}>
          <ModelCard name={name} meta={m} />
        </ContextMenu>
      ))}
    </div>
  ),
};

export const WithDisabledItem: Story = {
  name: 'With disabled item',
  args: {
    items: [
      { label: 'Show', onSelect: fn(), icon: <EyeOffIcon strokeWidth={2.2} />, disabled: true },
      ...modelItems.slice(1),
    ],
  },
};

export const Disabled: Story = {
  name: 'Disabled (native menu)',
  args: { disabled: true },
};
