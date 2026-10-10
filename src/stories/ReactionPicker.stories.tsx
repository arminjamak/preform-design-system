import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { ReactionBar, ReactionChip, ReactionPicker, type Reaction, type ReactionPickerProps } from '../components/ReactionPicker/ReactionPicker';
import { AvatarWithPresence } from '../components/PresenceIndicator/PresenceIndicator';
import { Card } from '../components/Card/Card';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Collaboration/ReactionPicker',
  component: ReactionPicker,
  tags: ['expanded'],
  args: {
    onSelect: fn(),
    onOpenChange: fn(),
    label: 'Add reaction',
    selected: ['👀'],
    placement: 'bottom',
    align: 'start',
    triggerSize: 'sm',
    triggerVariant: 'ghost',
    closeOnSelect: true,
    disabled: false,
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    triggerSize: { control: 'inline-radio', options: ['xs', 'sm', 'md'] },
    triggerVariant: { control: 'inline-radio', options: ['ghost', 'outline'] },
    open: { control: 'boolean' },
    'data-state': {
      control: 'inline-radio',
      options: [undefined, 'hover', 'focus', 'active'],
      name: 'forced state',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Smile-plus trigger that opens a `Popover` with six quick reactions (👍 🎉 ❤️ 👀 ✅ 🚀) and a small categorised emoji grid with search; arrow keys move through the grid, Enter on the search picks the first match. `ReactionBar` shows existing reactions as pill toggle chips with counts, accent-tinted (`--color-bg-accent-subtle`, `--color-border-accent`) when you reacted.',
      },
    },
  },
  decorators: [
    (S) => (
      <div
        style={{
          minHeight: 'calc(var(--space-24) * 4)',
          width: 'var(--size-layout-dialog-md)',
        }}
      >
        <S />
      </div>
    ),
  ],
  render: function Render(args) {
    const [{ open }, update] = useArgs<ReactionPickerProps>();
    return (
      <ReactionPicker
        {...args}
        open={open}
        onOpenChange={(v) => {
          args.onOpenChange?.(v);
          if (open !== undefined) update({ open: v });
        }}
      />
    );
  },
} satisfies Meta<typeof ReactionPicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Open: Story = { args: { open: true } };

export const OpenAbove: Story = {
  name: 'Open above (align end)',
  args: {
    open: true,
    placement: 'top',
    align: 'end',
    triggerVariant: 'outline',
  },
  decorators: [
    (S) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          minHeight: 'calc(var(--space-24) * 4)',
        }}
      >
        <S />
      </div>
    ),
  ],
};

const INITIAL: Reaction[] = [
  {
    emoji: '👍',
    count: 3,
    reacted: true,
    users: ['Priya Natarajan', 'Diego Alvarez'],
  },
  {
    emoji: '🎉',
    count: 2,
    reacted: false,
    users: ['Mei Chen', 'Diego Alvarez'],
  },
  { emoji: '👀', count: 1, reacted: false, users: ['Mei Chen'] },
  { emoji: '🔩', count: 1, reacted: true },
];

function CommentDemo() {
  const [reactions, setReactions] = useState(INITIAL);
  const toggle = (emoji: string) =>
    setReactions((list) =>
      list
        .map((r) =>
          r.emoji === emoji
            ? {
                ...r,
                reacted: !r.reacted,
                count: r.count + (r.reacted ? -1 : 1),
              }
            : r,
        )
        .filter((r) => r.count > 0),
    );
  const add = (emoji: string) =>
    setReactions((list) => {
      const hit = list.find((r) => r.emoji === emoji);
      if (hit) return hit.reacted ? list : list.map((r) => (r.emoji === emoji ? { ...r, reacted: true, count: r.count + 1 } : r));
      return [...list, { emoji, count: 1, reacted: true }];
    });
  return (
    <Card padding="md" style={{ width: 'var(--size-layout-dialog-md)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <AvatarWithPresence name="Priya Natarajan" status="online" size="sm" />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
            minWidth: 0,
          }}
        >
          <span className="pf-text-label">
            Priya Natarajan{' '}
            <span
              style={{
                color: 'var(--color-fg-muted)',
                fontWeight: 'var(--font-weight-regular)',
              }}
            >
              · Mini Chassis Kit · 10:42
            </span>
          </span>
          <p className="pf-text-body-sm" style={{ margin: 0 }}>
            Supports on the motor mount looked light, so I added 12 touchpoints and re-sliced at 50 µm. Print time is now 4 h 18 min on the Form 4.
          </p>
          <ReactionBar reactions={reactions} onToggle={toggle} onAdd={add} />
        </div>
      </div>
    </Card>
  );
}

export const OnAComment: Story = {
  name: 'ReactionBar on a comment',
  parameters: { controls: { disable: true } },
  render: () => <CommentDemo />,
};

export const BarVariants: Story = {
  name: 'ReactionBar variants',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack">
      <ReactionBar reactions={INITIAL} onToggle={fn()} />
      <ReactionBar reactions={INITIAL} onToggle={fn()} onAdd={fn()} />
      <ReactionBar
        reactions={[
          { emoji: '✅', count: 12, reacted: true },
          { emoji: '🚀', count: 128, reacted: false },
        ]}
        onToggle={fn()}
        onAdd={fn()}
      />
      <ReactionBar reactions={INITIAL} onToggle={fn()} disabled />
    </div>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        {
          label: 'Picker · ghost',
          render: (p) => <ReactionPicker {...args} {...p} open={false} triggerVariant="ghost" />,
        },
        {
          label: 'Picker · outline',
          render: (p) => <ReactionPicker {...args} {...p} open={false} triggerVariant="outline" />,
        },
        {
          label: 'Chip',
          render: (p) => <ReactionChip emoji="🎉" count={2} reacted={false} onToggle={fn()} {...p} />,
        },
        {
          label: 'Chip · you reacted',
          render: (p) => <ReactionChip emoji="👍" count={3} reacted onToggle={fn()} {...p} />,
        },
      ]}
    />
  ),
};
