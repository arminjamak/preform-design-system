import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { GripHorizontalIcon, GripVerticalIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { KEYBOARD_INSTRUCTIONS, lockBody, positionLift, settleLift, useFlip } from './dragUtils';
import s from './SortableList.module.css';

/* ------------------------------------------------------------------ DragHandle */

export type DragHandleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  WithForcedState & {
    /** Accessible name, e.g. "Reorder Fine detail". */
    label: string;
    /** `sm` 16×24 for dense rows, `md` 20×32 for profile cards. */
    size?: 'sm' | 'md';
    /** Grip direction: vertical dots for lists, horizontal for columns and tabs. */
    orientation?: 'vertical' | 'horizontal';
  };

/** Grip button that starts a drag. Shows a grab cursor, and grabbing while pressed or while `aria-grabbed` is true. */
export const DragHandle = forwardRef<HTMLButtonElement, DragHandleProps>(function DragHandle(
  { label, size = 'sm', orientation = 'vertical', className, type = 'button', ...rest },
  ref,
) {
  const Icon = orientation === 'vertical' ? GripVerticalIcon : GripHorizontalIcon;
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cx(s.handle, size === 'sm' ? s.handleSm : s.handleMd, orientation === 'horizontal' && s.horizontal, className)}
      {...rest}
    >
      <Icon strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
});

/* ---------------------------------------------------------------- SortableList */

/** Spread onto the element that starts a drag (usually a `DragHandle`). */
export type SortableHandleProps = {
  ref: (el: HTMLElement | null) => void;
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => void;
  onBlur: () => void;
  'aria-describedby': string;
  'aria-grabbed': boolean;
  disabled?: boolean;
};

export type SortableListRenderState = {
  handleProps: SortableHandleProps;
  /** True while this item is lifted (pointer or keyboard). */
  isDragging: boolean;
  /** True while this item is held with the keyboard. */
  isKeyboardDragging: boolean;
  /** Index in the rendered (preview) order. */
  index: number;
};

export type SortableListProps<T> = {
  items: T[];
  getId: (item: T) => string;
  renderItem: (item: T, state: SortableListRenderState) => ReactNode;
  /** Called on drop with the reordered array. */
  onReorder: (items: T[]) => void;
  /** Spoken name used in announcements ("Fine detail moved to position 2 of 4"). Defaults to the id. */
  getItemLabel?: (item: T) => string;
  /** Accessible name of the list. */
  label: string;
  gap?: 'none' | 'xs' | 'sm' | 'md';
  disabled?: boolean;
  /** Render this item in its lifted state without input (docs and visual tests). */
  previewDragId?: string;
  className?: string;
};

type DragState = { id: string; from: number; to: number; mode: 'pointer' | 'keyboard' | 'preview' };
type PointerSession = { pointer: { x: number; y: number }; grab: { x: number; y: number }; height: number; centers: number[] };

const GAP_CLASS = { none: s.gapNone, xs: s.gapXs, sm: s.gapSm, md: s.gapMd };

const move = <T,>(list: T[], from: number, to: number) => {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/**
 * Vertical list reordered by dragging a handle (pointer events, lifted card, drop placeholder)
 * or from the keyboard (Space to pick up, arrows to move, Space to drop, Escape to cancel).
 */
export function SortableList<T>({ items, getId, renderItem, onReorder, getItemLabel, label, gap = 'sm', disabled, previewDragId, className }: SortableListProps<T>) {
  const listRef = useRef<HTMLUListElement>(null);
  const slots = useRef(new Map<string, HTMLElement>());
  const lifts = useRef(new Map<string, HTMLElement>());
  const handles = useRef(new Map<string, HTMLElement>());
  const session = useRef<PointerSession | null>(null);
  const settling = useRef<{ id: string; pointer: { x: number; y: number }; grab: { x: number; y: number } } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const instructionsId = useId();

  const latest = useRef({ items, getId, getItemLabel, onReorder, drag });
  latest.current = { items, getId, getItemLabel, onReorder, drag };

  const nameOf = (id: string) => {
    const { items: list, getId: gid, getItemLabel: gl } = latest.current;
    const item = list.find((i) => gid(i) === id);
    return item && gl ? gl(item) : id;
  };

  const shown: DragState | null = useMemo(() => {
    if (drag) return drag;
    if (!previewDragId) return null;
    const i = items.findIndex((it) => getId(it) === previewDragId);
    return i < 0 ? null : { id: previewDragId, from: i, to: i, mode: 'preview' };
  }, [drag, previewDragId, items, getId]);

  const order = useMemo(() => {
    if (!drag || drag.from === drag.to) return items;
    return move(items, drag.from, drag.to);
  }, [items, drag]);

  useFlip(listRef, drag?.mode === 'pointer' ? drag.id : null);

  const finish = (commit: boolean) => {
    const cur = latest.current.drag;
    if (!cur || cur.mode === 'preview') return;
    const { items: list, onReorder: reorder } = latest.current;
    const name = nameOf(cur.id);
    const total = list.length;
    if (cur.mode === 'pointer' && session.current) {
      settling.current = { id: cur.id, pointer: session.current.pointer, grab: session.current.grab };
      session.current = null;
      lockBody(false);
    }
    if (commit && cur.to !== cur.from) {
      reorder(move(list, cur.from, cur.to));
      setAnnouncement(`${name} dropped at position ${cur.to + 1} of ${total}.`);
    } else if (commit) {
      setAnnouncement(cur.mode === 'keyboard' ? `${name} dropped. Position unchanged, ${cur.from + 1} of ${total}.` : '');
    } else {
      setAnnouncement(`Reorder cancelled. ${name} returned to position ${cur.from + 1} of ${total}.`);
    }
    setDrag(null);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Keep the lifted card under the pointer, refocus the held handle after a keyboard move, and ease drops into place.
  useLayoutEffect(() => {
    if (drag?.mode === 'pointer' && session.current) {
      positionLift(slots.current.get(drag.id), lifts.current.get(drag.id), session.current.pointer, session.current.grab, true);
    }
    if (drag?.mode === 'keyboard') {
      const h = handles.current.get(drag.id);
      if (h && document.activeElement !== h) h.focus();
    }
    if (!drag && settling.current) {
      const { id, pointer, grab } = settling.current;
      settling.current = null;
      const lift = lifts.current.get(id);
      positionLift(slots.current.get(id), lift, pointer, grab, true);
      void lift?.offsetWidth;
      settleLift(lift);
    }
  });

  // Window listeners for the active pointer drag.
  const pointerActive = drag?.mode === 'pointer';
  useEffect(() => {
    if (!pointerActive) return;
    const onMove = (e: PointerEvent) => {
      const sess = session.current;
      const cur = latest.current.drag;
      if (!sess || !cur) return;
      sess.pointer = { x: e.clientX, y: e.clientY };
      const center = e.clientY - sess.grab.y + sess.height / 2;
      let to = 0;
      sess.centers.forEach((c, i) => {
        if (i !== cur.from && c < center) to += 1;
      });
      if (to !== cur.to) setDrag({ ...cur, to });
      else positionLift(slots.current.get(cur.id), lifts.current.get(cur.id), sess.pointer, sess.grab, true);
    };
    const onUp = () => finishRef.current(true);
    const onCancel = () => finishRef.current(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      finishRef.current(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey, true);
      lockBody(false);
    };
  }, [pointerActive]);

  const startPointer = (id: string, e: ReactPointerEvent<HTMLElement>) => {
    if (disabled || e.button !== 0 || latest.current.drag) return;
    const ids = items.map(getId);
    const from = ids.indexOf(id);
    const slot = slots.current.get(id);
    if (from < 0 || !slot) return;
    e.preventDefault();
    handles.current.get(id)?.focus({ preventScroll: true });
    const r = slot.getBoundingClientRect();
    const centers = ids.map((other) => {
      const rr = slots.current.get(other)?.getBoundingClientRect();
      return rr ? rr.top + rr.height / 2 : 0;
    });
    session.current = { pointer: { x: e.clientX, y: e.clientY }, grab: { x: e.clientX - r.left, y: e.clientY - r.top }, height: r.height, centers };
    lockBody(true);
    setDrag({ id, from, to: from, mode: 'pointer' });
  };

  const onKeyDown = (id: string, e: ReactKeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    const cur = latest.current.drag;
    const total = items.length;
    if (!cur) {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      const from = items.findIndex((i) => getId(i) === id);
      setDrag({ id, from, to: from, mode: 'keyboard' });
      setAnnouncement(`Picked up ${nameOf(id)}. Position ${from + 1} of ${total}. Use the arrow keys to move, Space to drop, Escape to cancel.`);
      return;
    }
    if (cur.id !== id || cur.mode !== 'keyboard') return;
    const goTo = (to: number) => {
      const clamped = Math.max(0, Math.min(total - 1, to));
      if (clamped === cur.to) {
        setAnnouncement(`${nameOf(id)} is already ${clamped === 0 ? 'first' : 'last'}.`);
        return;
      }
      setDrag({ ...cur, to: clamped });
      setAnnouncement(`${nameOf(id)} moved to position ${clamped + 1} of ${total}.`);
    };
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        goTo(cur.to - 1);
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        goTo(cur.to + 1);
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(total - 1);
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
    // Moving a keyed node can blur it; the layout effect refocuses, so only cancel if focus really left.
    window.setTimeout(() => {
      const cur = latest.current.drag;
      if (cur?.mode === 'keyboard' && document.activeElement !== handles.current.get(cur.id)) finishRef.current(false);
    }, 0);
  };

  const register = (map: Map<string, HTMLElement>, id: string) => (el: HTMLElement | null) => {
    if (el) map.set(id, el);
    else if (map.get(id) && !map.get(id)?.isConnected) map.delete(id);
  };

  return (
    <div className={cx(s.root, disabled && s.disabled, className)}>
      <ul ref={listRef} className={cx(s.list, GAP_CLASS[gap])} aria-label={label}>
        {order.map((item, index) => {
          const id = getId(item);
          const isDragging = shown?.id === id;
          const isKeyboardDragging = isDragging && shown?.mode === 'keyboard';
          const handleProps: SortableHandleProps = {
            ref: register(handles.current, id),
            onPointerDown: (e) => startPointer(id, e),
            onKeyDown: (e) => onKeyDown(id, e),
            onBlur,
            'aria-describedby': instructionsId,
            'aria-grabbed': isDragging,
            disabled,
          };
          return (
            <li
              key={id}
              ref={register(slots.current, id)}
              data-flip-id={id}
              className={cx(s.item, isDragging && s.dragging, isDragging && shown?.mode !== 'pointer' && s.keyboard)}
            >
              {isDragging && <div className={s.placeholder} aria-hidden="true" />}
              <div ref={register(lifts.current, id)} className={s.lift}>
                {renderItem(item, { handleProps, isDragging, isKeyboardDragging, index })}
              </div>
            </li>
          );
        })}
      </ul>
      <span id={instructionsId} className={s.srOnly}>
        {KEYBOARD_INSTRUCTIONS}
      </span>
      <div className={s.srOnly} role="status" aria-live="assertive" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}
