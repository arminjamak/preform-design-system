import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { AlertTriangleIcon, InboxIcon, PlusIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Tone, WithForcedState } from '../../lib/types';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { KEYBOARD_INSTRUCTIONS, lockBody, positionLift, settleLift, useFlip } from '../SortableList/dragUtils';
import s from './KanbanBoard.module.css';

export type KanbanColumnDef = {
  id: string;
  title: string;
  /** Work-in-progress limit; the column warns when it holds more cards than this. */
  limit?: number;
};

export type KanbanTag = string | { label: string; tone?: Tone };

export type KanbanCardData = {
  id: string;
  columnId: string;
  title: string;
  /** Secondary line: printer, material, layer height, ETA. */
  meta?: ReactNode;
  tags?: KanbanTag[];
  /** Person responsible; rendered as an avatar. */
  assignee?: string;
};

/** Spread onto the element that starts a drag: the whole default card, or a handle inside a custom card. */
export type KanbanHandleProps = {
  ref: (el: HTMLElement | null) => void;
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => void;
  onBlur: () => void;
  tabIndex: number;
  'aria-describedby': string;
  'aria-grabbed': boolean;
};

export type KanbanRenderState = {
  handleProps: KanbanHandleProps;
  isDragging: boolean;
  isKeyboardDragging: boolean;
  column: KanbanColumnDef;
};

export type KanbanBoardProps = {
  columns: KanbanColumnDef[];
  /** Cards in display order; each column shows its cards in array order. */
  cards: KanbanCardData[];
  /** `toIndex` is the card's final index inside `toColumnId`. */
  onMove: (cardId: string, toColumnId: string, toIndex: number) => void;
  /** Custom card; spread `handleProps` on the draggable element. Defaults to `KanbanCard`. */
  renderCard?: (card: KanbanCardData, state: KanbanRenderState) => ReactNode;
  /** Shows an add button at the foot of every column. */
  onAddCard?: (columnId: string) => void;
  addCardLabel?: string;
  /** Hint shown in empty columns. */
  emptyLabel?: string;
  /** Accessible name of the board. */
  label: string;
  /** Render a card lifted at a target slot without input (docs and visual tests). */
  previewDrag?: { cardId: string; toColumnId: string; toIndex: number };
  className?: string;
};

/** Pure helper: returns `cards` with `cardId` moved to `toColumnId` at `toIndex` (index among that column's cards). */
export function moveKanbanCard(cards: KanbanCardData[], cardId: string, toColumnId: string, toIndex: number): KanbanCardData[] {
  const card = cards.find((c) => c.id === cardId);
  if (!card) return cards;
  const rest = cards.filter((c) => c.id !== cardId);
  const moved = { ...card, columnId: toColumnId };
  const inColumn = rest.filter((c) => c.columnId === toColumnId);
  if (toIndex >= inColumn.length) {
    const last = inColumn[inColumn.length - 1];
    const at = last ? rest.indexOf(last) + 1 : rest.length;
    rest.splice(at, 0, moved);
  } else {
    rest.splice(rest.indexOf(inColumn[Math.max(0, toIndex)]), 0, moved);
  }
  return rest;
}

/* ------------------------------------------------------------------ KanbanCard */

export type KanbanCardProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> &
  WithForcedState & {
    card: KanbanCardData;
    handleProps?: KanbanHandleProps;
  };

/** Default board card: title, meta line, tag badges and assignee. The whole card is the drag handle. */
export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(function KanbanCard({ card, handleProps, className, ...rest }, ref) {
  const titleId = useId();
  const metaId = useId();
  const { ref: handleRef, ...handle } = handleProps ?? {};
  return (
    <div
      ref={(el) => {
        handleRef?.(el);
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      role="button"
      aria-roledescription="draggable card"
      aria-labelledby={card.meta ? `${titleId} ${metaId}` : titleId}
      tabIndex={0}
      className={cx(s.card, className)}
      {...handle}
      {...rest}
    >
      <div className={s.cardTop}>
        <span id={titleId} className={s.cardTitle}>
          {card.title}
        </span>
        {card.assignee && <Avatar name={card.assignee} size="xs" tone="accent" />}
      </div>
      {card.meta && (
        <p id={metaId} className={s.cardMeta}>
          {card.meta}
        </p>
      )}
      {card.tags && card.tags.length > 0 && (
        <div className={s.tags}>
          {card.tags.map((t) => {
            const tag = typeof t === 'string' ? { label: t, tone: 'neutral' as Tone } : t;
            return (
              <Badge key={tag.label} tone={tag.tone ?? 'neutral'} variant="soft">
                {tag.label}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
});

/* ----------------------------------------------------------------- KanbanBoard */

type DragState = { id: string; fromCol: string; fromIndex: number; toCol: string; toIndex: number; mode: 'pointer' | 'keyboard' | 'preview' };
type Session = {
  pointer: { x: number; y: number };
  grab: { x: number; y: number };
  height: number;
  columns: Array<{ id: string; left: number; right: number }>;
  centers: Record<string, number[]>;
};
type Pending = { id: string; x: number; y: number };

const DRAG_THRESHOLD = 4;
const EDGE_SCROLL_ZONE = 48;
const EDGE_SCROLL_STEP = 16;
const INTERACTIVE = 'button, a, input, select, textarea, [contenteditable="true"]';

/**
 * Columns of cards that move between and within columns by pointer or keyboard
 * (Space to pick up, arrows to move across rows and columns, Space to drop, Escape to cancel).
 * Columns show a count badge and warn past their WIP limit.
 */
export function KanbanBoard({ columns, cards, onMove, renderCard, onAddCard, addCardLabel = 'Add card', emptyLabel = 'Nothing here yet. Drag a card into this column.', label, previewDrag, className }: KanbanBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const columnEls = useRef(new Map<string, HTMLElement>());
  const slots = useRef(new Map<string, HTMLElement>());
  const lifts = useRef(new Map<string, HTMLElement>());
  const handles = useRef(new Map<string, HTMLElement>());
  const session = useRef<Session | null>(null);
  const pending = useRef<Pending | null>(null);
  const settling = useRef<{ id: string; pointer: { x: number; y: number }; grab: { x: number; y: number } } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const instructionsId = useId();
  const latest = useRef({ cards, columns, onMove, drag });
  latest.current = { cards, columns, onMove, drag };

  const shown: DragState | null = useMemo(() => {
    if (drag) return drag;
    if (!previewDrag) return null;
    const card = cards.find((c) => c.id === previewDrag.cardId);
    if (!card) return null;
    const fromIndex = cards.filter((c) => c.columnId === card.columnId).indexOf(card);
    return { id: card.id, fromCol: card.columnId, fromIndex, toCol: previewDrag.toColumnId, toIndex: previewDrag.toIndex, mode: 'preview' };
  }, [drag, previewDrag, cards]);

  /** Cards per column in preview order (the held card sits at its target slot). */
  const byColumn = useMemo(() => {
    const map = new Map<string, KanbanCardData[]>(columns.map((c) => [c.id, []]));
    const held = shown ? cards.find((c) => c.id === shown.id) : undefined;
    for (const c of cards) if (c.id !== held?.id) map.get(c.columnId)?.push(c);
    if (shown && held) {
      const list = map.get(shown.toCol);
      list?.splice(Math.min(shown.toIndex, list.length), 0, held);
    }
    return map;
  }, [cards, columns, shown]);

  const cardTitle = (id: string) => latest.current.cards.find((c) => c.id === id)?.title ?? id;
  const columnOf = (id: string) => latest.current.columns.find((c) => c.id === id);
  const columnCount = (colId: string, heldId: string) => latest.current.cards.filter((c) => c.columnId === colId && c.id !== heldId).length;

  const describeSlot = (d: DragState) => {
    const col = columnOf(d.toCol);
    const total = columnCount(d.toCol, d.id) + 1;
    const over = col?.limit != null && total > col.limit ? ` ${col.title} is over its limit of ${col.limit}.` : '';
    return `${col?.title ?? d.toCol}, position ${d.toIndex + 1} of ${total}.${over}`;
  };

  useFlip(boardRef, drag?.mode === 'pointer' ? drag.id : null);

  const finish = (commit: boolean) => {
    const cur = latest.current.drag;
    if (!cur || cur.mode === 'preview') return;
    if (cur.mode === 'pointer' && session.current) {
      settling.current = { id: cur.id, pointer: session.current.pointer, grab: session.current.grab };
      session.current = null;
      lockBody(false);
    }
    const name = cardTitle(cur.id);
    const changed = cur.toCol !== cur.fromCol || cur.toIndex !== cur.fromIndex;
    if (commit && changed) {
      latest.current.onMove(cur.id, cur.toCol, cur.toIndex);
      setAnnouncement(`${name} dropped in ${describeSlot(cur)}`);
    } else if (commit) {
      setAnnouncement(cur.mode === 'keyboard' ? `${name} dropped. No change.` : '');
    } else {
      setAnnouncement(`Move cancelled. ${name} returned to ${columnOf(cur.fromCol)?.title ?? cur.fromCol}.`);
    }
    setDrag(null);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  useLayoutEffect(() => {
    if (drag?.mode === 'pointer' && session.current) {
      positionLift(slots.current.get(drag.id), lifts.current.get(drag.id), session.current.pointer, session.current.grab);
    }
    if (drag?.mode === 'keyboard') {
      const h = handles.current.get(drag.id);
      if (h && document.activeElement !== h) h.focus();
      h?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    if (!drag && settling.current) {
      const { id, pointer, grab } = settling.current;
      settling.current = null;
      const lift = lifts.current.get(id);
      positionLift(slots.current.get(id), lift, pointer, grab);
      void lift?.offsetWidth;
      settleLift(lift);
    }
  });

  const begin = (p: Pending, e: PointerEvent) => {
    const board = boardRef.current;
    const slot = slots.current.get(p.id);
    const card = latest.current.cards.find((c) => c.id === p.id);
    if (!board || !slot || !card) return;
    const b = board.getBoundingClientRect();
    const r = slot.getBoundingClientRect();
    const cols = latest.current.columns.map((col) => {
      const cr = columnEls.current.get(col.id)?.getBoundingClientRect();
      return { id: col.id, left: cr ? cr.left - b.left + board.scrollLeft : 0, right: cr ? cr.right - b.left + board.scrollLeft : 0 };
    });
    const centers: Record<string, number[]> = {};
    for (const col of latest.current.columns) {
      centers[col.id] = latest.current.cards
        .filter((c) => c.columnId === col.id && c.id !== p.id)
        .map((c) => {
          const cr = slots.current.get(c.id)?.getBoundingClientRect();
          return cr ? cr.top + cr.height / 2 : 0;
        });
    }
    session.current = { pointer: { x: e.clientX, y: e.clientY }, grab: { x: p.x - r.left, y: p.y - r.top }, height: r.height, columns: cols, centers };
    const fromIndex = latest.current.cards.filter((c) => c.columnId === card.columnId).indexOf(card);
    window.getSelection()?.removeAllRanges();
    handles.current.get(p.id)?.focus({ preventScroll: true });
    lockBody(true);
    setDrag({ id: p.id, fromCol: card.columnId, fromIndex, toCol: card.columnId, toIndex: fromIndex, mode: 'pointer' });
  };

  // Pending press → drag after a small threshold, so clicks inside cards still work.
  useEffect(() => {
    const onMovePointer = (e: PointerEvent) => {
      const p = pending.current;
      if (p && !session.current) {
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD) return;
        pending.current = null;
        begin(p, e);
      }
      const sess = session.current;
      const cur = latest.current.drag;
      const board = boardRef.current;
      if (!sess || !cur || cur.mode !== 'pointer' || !board) return;
      sess.pointer = { x: e.clientX, y: e.clientY };
      const b = board.getBoundingClientRect();
      if (e.clientX > b.right - EDGE_SCROLL_ZONE) board.scrollLeft += EDGE_SCROLL_STEP;
      else if (e.clientX < b.left + EDGE_SCROLL_ZONE) board.scrollLeft -= EDGE_SCROLL_STEP;
      const x = e.clientX - b.left + board.scrollLeft;
      const hit =
        sess.columns.find((c) => x >= c.left && x <= c.right) ??
        sess.columns.reduce((best, c) => (Math.abs((c.left + c.right) / 2 - x) < Math.abs((best.left + best.right) / 2 - x) ? c : best), sess.columns[0]);
      const center = e.clientY - sess.grab.y + sess.height / 2;
      const toIndex = (sess.centers[hit.id] ?? []).filter((c) => c < center).length;
      if (hit.id !== cur.toCol || toIndex !== cur.toIndex) setDrag({ ...cur, toCol: hit.id, toIndex });
      else positionLift(slots.current.get(cur.id), lifts.current.get(cur.id), sess.pointer, sess.grab);
    };
    const onUp = () => {
      pending.current = null;
      if (session.current) finishRef.current(true);
    };
    const onCancel = () => {
      pending.current = null;
      if (session.current) finishRef.current(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !session.current) return;
      e.preventDefault();
      e.stopPropagation();
      finishRef.current(false);
    };
    window.addEventListener('pointermove', onMovePointer);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointermove', onMovePointer);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey, true);
      lockBody(false);
    };
  }, []);

  const onPointerDown = (id: string, e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 || latest.current.drag) return;
    const interactive = (e.target as HTMLElement).closest(INTERACTIVE);
    if (interactive && interactive !== e.currentTarget) return;
    pending.current = { id, x: e.clientX, y: e.clientY };
  };

  const onKeyDown = (id: string, e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    const cur = latest.current.drag;
    if (!cur) {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      const card = cards.find((c) => c.id === id);
      if (!card) return;
      const fromIndex = cards.filter((c) => c.columnId === card.columnId).indexOf(card);
      const next: DragState = { id, fromCol: card.columnId, fromIndex, toCol: card.columnId, toIndex: fromIndex, mode: 'keyboard' };
      setDrag(next);
      setAnnouncement(`Picked up ${card.title} in ${describeSlot(next)} Use the arrow keys to move, Space to drop, Escape to cancel.`);
      return;
    }
    if (cur.id !== id || cur.mode !== 'keyboard') return;
    const colIdx = columns.findIndex((c) => c.id === cur.toCol);
    const go = (toCol: string, toIndex: number) => {
      const max = columnCount(toCol, id);
      const next = { ...cur, toCol, toIndex: Math.max(0, Math.min(max, toIndex)) };
      if (next.toCol === cur.toCol && next.toIndex === cur.toIndex) {
        setAnnouncement(`${cardTitle(id)} can't move further.`);
        return;
      }
      setDrag(next);
      setAnnouncement(`${cardTitle(id)} moved to ${describeSlot(next)}`);
    };
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        go(cur.toCol, cur.toIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        go(cur.toCol, cur.toIndex + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (colIdx > 0) go(columns[colIdx - 1].id, cur.toIndex);
        else setAnnouncement(`${cardTitle(id)} is in the first column.`);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (colIdx < columns.length - 1) go(columns[colIdx + 1].id, cur.toIndex);
        else setAnnouncement(`${cardTitle(id)} is in the last column.`);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        finish(true);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        finish(false);
        break;
      case 'Tab':
        finish(false);
        break;
      default:
    }
  };

  const onBlur = () => {
    window.setTimeout(() => {
      const cur = latest.current.drag;
      if (cur?.mode === 'keyboard' && document.activeElement !== handles.current.get(cur.id)) finishRef.current(false);
    }, 0);
  };

  const register = (map: Map<string, HTMLElement>, id: string) => (el: HTMLElement | null) => {
    if (el) map.set(id, el);
  };

  return (
    <div ref={boardRef} role="region" aria-label={label} className={cx(s.board, className)}>
      {columns.map((col) => {
        const list = byColumn.get(col.id) ?? [];
        const count = list.length;
        const over = col.limit != null && count > col.limit;
        const atLimit = col.limit != null && count === col.limit;
        const isTarget = !!drag && drag.mode === 'pointer' && drag.toCol === col.id;
        const headingId = `${instructionsId}-${col.id}`;
        return (
          <section key={col.id} ref={register(columnEls.current, col.id)} aria-labelledby={headingId} className={cx(s.column, over && s.overLimit, isTarget && s.dropTarget)}>
            <header className={s.header}>
              <h3 id={headingId} className={s.title}>
                {col.title}
              </h3>
              <span className={s.headerEnd}>
                {over ? (
                  <span className={s.warning} title={`Over the WIP limit of ${col.limit}`}>
                    <AlertTriangleIcon strokeWidth={2.4} aria-hidden="true" />
                    Over limit
                    <strong className={s.warningCount} aria-hidden="true">{`${count}/${col.limit}`}</strong>
                    <span className={s.srOnly}>{`, ${count} cards, limit ${col.limit}`}</span>
                  </span>
                ) : (
                  <Badge tone={atLimit ? 'accent' : 'neutral'} variant="soft">
                    <span aria-hidden="true">{col.limit != null ? `${count}/${col.limit}` : count}</span>
                    <span className={s.srOnly}>{col.limit != null ? `${count} cards, limit ${col.limit}` : `${count} cards`}</span>
                  </Badge>
                )}
              </span>
            </header>
            <ul className={s.cards} aria-labelledby={headingId}>
              {list.length === 0 && (
                <li className={s.empty}>
                  <InboxIcon strokeWidth={1.8} aria-hidden="true" />
                  {emptyLabel}
                </li>
              )}
              {list.map((card) => {
                const isDragging = shown?.id === card.id;
                const isKeyboardDragging = isDragging && shown?.mode === 'keyboard';
                const handleProps: KanbanHandleProps = {
                  ref: register(handles.current, card.id),
                  onPointerDown: (e) => onPointerDown(card.id, e),
                  onKeyDown: (e) => onKeyDown(card.id, e),
                  onBlur,
                  tabIndex: 0,
                  'aria-describedby': instructionsId,
                  'aria-grabbed': isDragging,
                };
                return (
                  <li key={card.id} ref={register(slots.current, card.id)} data-flip-id={card.id} className={cx(s.item, isDragging && s.dragging)}>
                    {isDragging && shown?.mode === 'pointer' && <div className={s.placeholder} aria-hidden="true" />}
                    <div ref={register(lifts.current, card.id)} className={s.lift}>
                      {renderCard ? renderCard(card, { handleProps, isDragging, isKeyboardDragging, column: col }) : <KanbanCard card={card} handleProps={handleProps} />}
                    </div>
                  </li>
                );
              })}
            </ul>
            {onAddCard && (
              <Button variant="ghost" shape="rounded" fullWidth iconStart={<PlusIcon strokeWidth={2.4} />} onClick={() => onAddCard(col.id)} aria-label={`${addCardLabel} to ${col.title}`}>
                {addCardLabel}
              </Button>
            )}
          </section>
        );
      })}
      <span id={instructionsId} className={s.srOnly}>
        {KEYBOARD_INSTRUCTIONS} Left and right arrows move between columns.
      </span>
      <div className={s.srOnly} role="status" aria-live="assertive" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}
