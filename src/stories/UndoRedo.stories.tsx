import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Button } from '../components/Button/Button';
import { Kbd } from '../components/Kbd/Kbd';
import { UndoRedo, useUndoRedo } from '../components/UndoRedo/UndoRedo';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Interaction/UndoRedo',
  component: UndoRedo,
  tags: ['expanded'],
  args: {
    canUndo: true,
    canRedo: true,
    undoLabel: 'Generate supports',
    redoLabel: 'Orient',
    historyCount: 6,
    onUndo: fn(),
    onRedo: fn(),
    variant: 'ghost',
    size: 'sm',
    platform: 'auto',
    tooltipPlacement: 'bottom',
    disabled: false,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['ghost', 'outline', 'floating'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    platform: { control: 'inline-radio', options: ['auto', 'mac', 'pc'] },
    tooltipPlacement: { control: 'inline-radio', options: ['top', 'bottom'] },
    historyCount: { control: { type: 'number', min: 0 } },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Undo / Redo pair from the PreForm toolbar. Tooltips name the next action and its platform shortcut ("Undo Generate supports ⌘Z"); buttons disable when history runs out and a badge counts the undo steps. `useUndoRedo` keeps a labelled linear history and binds ⌘Z / Ctrl+Z, ⇧⌘Z / Ctrl+Shift+Z and Ctrl+Y.',
      },
    },
  },
  decorators: [(S) => <div style={{ padding: 'var(--space-2) var(--space-16) var(--space-10)' }}><S /></div>],
} satisfies Meta<typeof UndoRedo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [{ historyCount = 0 }, update] = useArgs<{ historyCount?: number; canRedo?: boolean }>();
    return (
      <UndoRedo
        {...args}
        historyCount={historyCount}
        canUndo={args.canUndo && historyCount > 0}
        onUndo={() => {
          args.onUndo();
          update({ historyCount: Math.max(0, historyCount - 1), canRedo: true });
        }}
        onRedo={() => {
          args.onRedo();
          update({ historyCount: historyCount + 1 });
        }}
      />
    );
  },
};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="sb-stack">
      <UndoRedo {...args} variant="ghost" />
      <UndoRedo {...args} variant="outline" />
      <UndoRedo {...args} variant="floating" historyCount={undefined} />
      <UndoRedo {...args} variant="floating" size="md" />
    </div>
  ),
};

export const NothingToRedo: Story = { args: { canRedo: false, redoLabel: undefined, historyCount: 3 } };
export const FreshJob: Story = { args: { canUndo: false, canRedo: false, undoLabel: undefined, redoLabel: undefined, historyCount: 0 } };

type Scene = { models: number; supports: boolean; oriented: boolean; scale: number };

/** Live `useUndoRedo` history. Apply a few edits, then use the buttons or the keyboard shortcuts. */
export const WithHook: Story = {
  parameters: { controls: { include: ['variant', 'platform'] } },
  render: function Render(args) {
    const h = useUndoRedo<Scene>({ models: 1, supports: false, oriented: false, scale: 100 });
    const v = h.value;
    return (
      <div className="sb-stack" style={{ width: 'var(--size-layout-dialog-md)' }}>
        <UndoRedo
          variant={args.variant}
          platform={args.platform}
          canUndo={h.canUndo}
          canRedo={h.canRedo}
          undoLabel={h.undoLabel}
          redoLabel={h.redoLabel}
          historyCount={h.historyCount}
          onUndo={h.undo}
          onRedo={h.redo}
        />
        <div className="sb-row">
          <Button onClick={() => h.push((s) => ({ ...s, oriented: true }), 'Orient')}>Orient</Button>
          <Button onClick={() => h.push((s) => ({ ...s, supports: true }), 'Generate supports')}>Generate supports</Button>
          <Button onClick={() => h.push((s) => ({ ...s, models: s.models + 1 }), 'Duplicate')}>Duplicate</Button>
          <Button onClick={() => h.push((s) => ({ ...s, scale: s.scale + 10 }), 'Scale to 110%')}>Scale +10%</Button>
        </div>
        <p className="pf-text-body-sm" style={{ color: 'var(--color-fg-secondary)' }}>
          {v.models} {v.models === 1 ? 'model' : 'models'} · {v.oriented ? 'oriented' : 'not oriented'} · {v.supports ? 'supports generated' : 'no supports'} · scale {v.scale}%
        </p>
        <p className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>
          Try <Kbd keys="mod+z" platform={args.platform} size="xs" /> and <Kbd keys="mod+shift+z" platform={args.platform} size="xs" /> with focus outside a text field.
        </p>
      </div>
    );
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  decorators: [],
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'ghost', render: ({ disabled, ...p }) => <UndoRedo {...args} variant="ghost" historyCount={undefined} disabled={disabled} {...p} /> },
        { label: 'floating', render: ({ disabled, ...p }) => <UndoRedo {...args} variant="floating" historyCount={undefined} disabled={disabled} {...p} /> },
      ]}
    />
  ),
};
