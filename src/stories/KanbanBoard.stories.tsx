import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { useState } from 'react';
import { Card } from '../components/Card/Card';
import { Badge } from '../components/Badge/Badge';
import { DragHandle } from '../components/SortableList/SortableList';
import { KanbanBoard, KanbanCard, moveKanbanCard, type KanbanCardData, type KanbanColumnDef } from '../components/KanbanBoard/KanbanBoard';
import { StateMatrix } from './helpers/StateMatrix';

const columns: KanbanColumnDef[] = [
  { id: 'prepare', title: 'Prepare' },
  { id: 'queued', title: 'Queued', limit: 4 },
  { id: 'printing', title: 'Printing', limit: 2 },
  { id: 'wash', title: 'Wash & Cure', limit: 3 },
  { id: 'done', title: 'Done' },
];

const cards: KanbanCardData[] = [
  { id: 'job-118', columnId: 'prepare', title: 'Bracket_v3', meta: 'Form 4 · Grey V5 · 100 µm', tags: ['Needs supports'], assignee: 'Maya Chen' },
  { id: 'job-121', columnId: 'prepare', title: 'Crown set, patient 2231', meta: 'Form 4B · Dental LT Clear V2 · 50 µm', tags: [{ label: 'Rush', tone: 'danger' }], assignee: 'Luis Ortega' },
  { id: 'job-114', columnId: 'queued', title: 'Impeller housing', meta: 'Form 4L · Tough 2000 · 100 µm · 6 h 12 min', tags: ['Resin tank 2'], assignee: 'Priya Nair' },
  { id: 'job-109', columnId: 'printing', title: 'Signet ring ×7', meta: 'Form 4 · Castable Wax 40 · 25 µm · 38% done', tags: [{ label: 'Jewelry', tone: 'info' }], assignee: 'Maya Chen' },
  { id: 'job-110', columnId: 'printing', title: 'Drill guide, case 88', meta: 'Form 4B · Surgical Guide · 50 µm · 72% done', tags: [{ label: 'Rush', tone: 'danger' }] },
  { id: 'job-105', columnId: 'queued', title: 'Gripper fingers', meta: 'Form 4 · Rigid 10K · 100 µm · 3 h 40 min', assignee: 'Sam Patel' },
  { id: 'job-101', columnId: 'wash', title: 'Hearing aid shells', meta: 'Form Wash · 10 min IPA · Cure 60 °C', tags: ['Post-cure'], assignee: 'Luis Ortega' },
];

const meta = {
  title: 'Components/Interaction/KanbanBoard',
  component: KanbanBoard,
  tags: ['expanded'],
  args: {
    label: 'Print jobs',
    columns,
    cards,
    onMove: fn(),
    onAddCard: fn(),
    addCardLabel: 'Add job',
    emptyLabel: 'No jobs here yet. Drag a card into this column.',
    previewDrag: undefined,
  },
  argTypes: {
    columns: { control: 'object' },
    cards: { control: 'object' },
    previewDrag: { control: 'object' },
    renderCard: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Job board for the print farm: jobs move Prepare → Queued → Printing → Wash & Cure → Done. Drag a card, or focus it and press Space, then the arrow keys (left/right switch columns) and Space to drop. Columns count their cards and warn past their WIP limit with `--color-status-warning`; the lifted card uses `--elevation-popover`. The board scrolls horizontally.',
      },
    },
  },
  render: function Render(args) {
    const [{ cards: current }, update] = useArgs<{ cards: KanbanCardData[] }>();
    return (
      <KanbanBoard
        {...args}
        cards={current}
        onMove={(id, col, index) => {
          args.onMove(id, col, index);
          update({ cards: moveKanbanCard(current, id, col, index) });
        }}
        onAddCard={
          args.onAddCard &&
          ((col) => {
            args.onAddCard?.(col);
            const n = current.length + 120;
            update({ cards: [...current, { id: `job-${n}`, columnId: col, title: `New job ${n}`, meta: 'Form 4 · Grey V5 · 100 µm' }] });
          })
        }
      />
    );
  },
} satisfies Meta<typeof KanbanBoard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Printing holds three jobs against a limit of two, so its header warns and the column gets an amber edge. */
export const OverWipLimit: Story = {
  args: { cards: cards.map((c) => (c.id === 'job-105' ? { ...c, columnId: 'printing' } : c)) },
};

/** A fresh shift: most columns empty, showing the drop hint. */
export const EmptyColumns: Story = {
  args: { cards: cards.filter((c) => c.columnId === 'prepare') },
};

/** Frozen mid-drag: the bracket is held at the top of Queued. */
export const Dragging: Story = {
  args: { previewDrag: { cardId: 'job-118', toColumnId: 'queued', toIndex: 0 } },
};

/** `renderCard` with a dedicated handle: only the grip starts a drag, so the rest of the card can hold controls. */
export const CustomCard: Story = {
  args: { onAddCard: undefined },
  render: function Render(args) {
    const [list, setList] = useState(cards);
    return (
      <KanbanBoard
        {...args}
        cards={list}
        onMove={(id, col, index) => setList((cur) => moveKanbanCard(cur, id, col, index))}
        renderCard={(card, { handleProps, column }) => (
          <Card padding="sm" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', paddingLeft: 'var(--space-1)' }}>
            <DragHandle label={`Move ${card.title}`} {...handleProps} />
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span className="pf-text-body-strong">{card.title}</span>
              <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>
                {card.id.toUpperCase()}
              </span>
            </span>
            <Badge tone={column.id === 'done' ? 'success' : column.id === 'printing' ? 'accent' : 'neutral'}>{column.title}</Badge>
          </Card>
        )}
      />
    );
  },
};

export const States: Story = {
  parameters: { controls: { disable: true }, layout: 'centered' },
  render: () => (
    <StateMatrix
      render={({ disabled, ...p }) => (
        <div style={{ width: 'var(--size-layout-sidebar)' }}>
          <KanbanCard card={cards[1]} aria-disabled={disabled || undefined} {...p} />
        </div>
      )}
    />
  ),
};
