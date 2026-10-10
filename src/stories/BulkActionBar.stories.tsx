import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { BoxIcon, CopyIcon, DownloadIcon, EyeOffIcon, LayoutGridIcon, Rotate3dIcon, Trash2Icon, WandSparklesIcon } from 'lucide-react';
import { BulkActionBar, type BulkAction } from '../components/BulkActionBar/BulkActionBar';
import { formatShortcut } from '../components/Kbd/Kbd';
import { StateMatrix } from './helpers/StateMatrix';

const ic = { strokeWidth: 2.2 } as const;
const actions: BulkAction[] = [
  { id: 'duplicate', label: 'Duplicate', icon: <CopyIcon {...ic} />, onClick: fn(), shortcut: formatShortcut('mod+d') },
  { id: 'orient', label: 'Orient', icon: <Rotate3dIcon {...ic} />, onClick: fn() },
  { id: 'supports', label: 'Generate supports', icon: <WandSparklesIcon {...ic} />, onClick: fn() },
  { id: 'layout', label: 'Lay out', icon: <LayoutGridIcon {...ic} />, onClick: fn(), shortcut: formatShortcut('mod+l') },
  { id: 'hide', label: 'Hide', icon: <EyeOffIcon {...ic} />, onClick: fn(), shortcut: formatShortcut('h') },
  { id: 'export', label: 'Export STL…', icon: <DownloadIcon {...ic} />, onClick: fn() },
  { id: 'delete', label: 'Delete', icon: <Trash2Icon {...ic} />, onClick: fn(), danger: true },
];

/** Stand-in for the 3D viewport: the floating bar docks to this positioned container. */
function Viewport({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 'calc(var(--size-layout-dialog-lg) + var(--space-24) * 2)',
        maxWidth: '100%',
        height: 'calc(var(--space-24) * 3)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-canvas)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

const models = ['Bracket_v3', 'Impeller', 'Crown 14', 'Crown 15', 'Signet ring', 'Gripper L', 'Gripper R', 'Drill guide'];

const tileStyle = (selected: boolean): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-1)',
  height: 'var(--space-16)',
  borderRadius: 'var(--radius-md)',
  border: `var(--border-width-2) solid ${selected ? 'var(--color-border-focus)' : 'transparent'}`,
  background: selected ? 'var(--color-bg-accent-subtle)' : 'var(--color-bg-surface)',
  color: 'var(--color-fg-default)',
  boxShadow: 'var(--elevation-raised)',
});

const meta = {
  title: 'Components/Interaction/BulkActionBar',
  component: BulkActionBar,
  tags: ['expanded'],
  args: {
    count: 3,
    noun: { one: 'model', other: 'models' },
    actions,
    maxVisible: 3,
    onClear: fn(),
    position: 'bottom',
    inline: false,
    disabled: false,
  },
  argTypes: {
    count: { control: { type: 'number', min: 0, max: 40 } },
    label: { control: 'text' },
    noun: { control: 'object' },
    actions: { control: false },
    maxVisible: { control: { type: 'number', min: 0, max: 6 } },
    position: { control: 'inline-radio', options: ['bottom', 'top'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Multi-select toolbar that slides up over the viewport while models are selected. Main actions are ghost buttons, Delete is the danger pill, the rest live in the ⋯ menu. Arrow keys move between controls and Escape clears the selection. Surface `--color-bg-surface` with `--elevation-popover`; enters with `--motion-duration-base`.',
      },
    },
  },
  render: function Render(args) {
    const [, update] = useArgs();
    return (
      <Viewport>
        <BulkActionBar
          {...args}
          onClear={() => {
            args.onClear();
            update({ count: 0 });
          }}
        />
      </Viewport>
    );
  },
} satisfies Meta<typeof BulkActionBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Click models to select them; the bar slides in on the first selection and out when cleared. */
export const Selecting: Story = {
  parameters: { controls: { include: ['position', 'maxVisible'] } },
  render: function Render(args) {
    const [selected, setSelected] = useState<string[]>(['Crown 14', 'Crown 15']);
    const toggle = (m: string) => setSelected((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));
    return (
      <Viewport>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', padding: 'var(--space-4)', paddingTop: args.position === 'top' ? 'var(--space-16)' : 'var(--space-4)' }}>
          {models.map((m) => (
            <button key={m} type="button" aria-pressed={selected.includes(m)} onClick={() => toggle(m)} style={tileStyle(selected.includes(m))}>
              <BoxIcon strokeWidth={1.8} style={{ width: 'var(--size-icon-md)', height: 'var(--size-icon-md)', color: 'var(--color-fg-muted)' }} aria-hidden="true" />
              <span className="pf-text-label-sm">{m}</span>
            </button>
          ))}
        </div>
        <BulkActionBar {...args} count={selected.length} onClear={() => setSelected([])} />
      </Viewport>
    );
  },
};

export const Top: Story = { args: { position: 'top' } };

export const SingleModel: Story = { args: { count: 1 } };

/** In normal flow, e.g. above a job list in the dashboard. */
export const Inline: Story = {
  args: { inline: true, noun: { one: 'print job', other: 'print jobs' }, count: 5, actions: [actions[0], actions[5], { ...actions[6], label: 'Cancel jobs' }] },
  render: (args) => <BulkActionBar {...args} />,
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix render={(p) => <BulkActionBar inline count={3} noun={{ one: 'model', other: 'models' }} actions={actions.slice(0, 1).concat(actions[6])} onClear={() => {}} {...p} />} />
  ),
};
