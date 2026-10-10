import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { Redo2Icon, Undo2Icon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Badge } from '../Badge/Badge';
import { IconButton } from '../IconButton/IconButton';
import { Tooltip } from '../Tooltip/Tooltip';
import { ariaKeyshortcuts, detectKbdPlatform, Kbd, type KbdPlatform } from '../Kbd/Kbd';
import s from './UndoRedo.module.css';

/* --------------------------------------------------------------------- UndoRedo */

export type UndoRedoProps = WithForcedState & {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  /** Name of the action that Undo would revert, e.g. "Generate supports". */
  undoLabel?: string;
  /** Name of the action that Redo would re-apply. */
  redoLabel?: string;
  /** Steps available to undo; shows a count badge when set. */
  historyCount?: number;
  /** `ghost` for toolbars, `outline` for panels, `floating` for the pill over the 3D viewport. */
  variant?: 'ghost' | 'outline' | 'floating';
  size?: 'sm' | 'md';
  platform?: KbdPlatform | 'auto';
  tooltipPlacement?: 'top' | 'bottom';
  disabled?: boolean;
  className?: string;
};

/** Undo / Redo icon pair with tooltips that name the next action and its shortcut. Pair with `useUndoRedo`. */
export function UndoRedo({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  undoLabel,
  redoLabel,
  historyCount,
  variant = 'ghost',
  size = 'sm',
  platform = 'auto',
  tooltipPlacement = 'bottom',
  disabled,
  className,
  'data-state': state,
}: UndoRedoProps) {
  const undoEnabled = canUndo && !disabled;
  const redoEnabled = canRedo && !disabled;
  const undoName = undoEnabled ? `Undo${undoLabel ? ` ${undoLabel}` : ''}` : 'Nothing to undo';
  const redoName = redoEnabled ? `Redo${redoLabel ? ` ${redoLabel}` : ''}` : 'Nothing to redo';
  return (
    <div role="group" aria-label="History" className={cx(s.group, variant !== 'ghost' && s[variant], className)}>
      <Tooltip
        placement={tooltipPlacement}
        content={
          <span className={s.tip}>
            {undoName}
            {undoEnabled && <Kbd keys="mod+z" platform={platform} size="xs" variant="inverse" />}
          </span>
        }
      >
        <IconButton
          label={undoName}
          title={undefined}
          icon={<Undo2Icon strokeWidth={2.2} />}
          variant="ghost"
          size={size}
          shape={variant === 'floating' ? 'circle' : 'rounded'}
          disabled={!undoEnabled}
          aria-keyshortcuts={ariaKeyshortcuts('mod+z', platform)}
          onClick={onUndo}
          data-state={state}
        />
      </Tooltip>
      <Tooltip
        placement={tooltipPlacement}
        content={
          <span className={s.tip}>
            {redoName}
            {redoEnabled && <Kbd keys="mod+shift+z" platform={platform} size="xs" variant="inverse" />}
          </span>
        }
      >
        <IconButton
          label={redoName}
          title={undefined}
          icon={<Redo2Icon strokeWidth={2.2} />}
          variant="ghost"
          size={size}
          shape={variant === 'floating' ? 'circle' : 'rounded'}
          disabled={!redoEnabled}
          aria-keyshortcuts={ariaKeyshortcuts('mod+shift+z', platform)}
          onClick={onRedo}
        />
      </Tooltip>
      {historyCount != null && (
        <span className={s.count}>
          <Badge tone={historyCount > 0 ? 'accent' : 'neutral'} variant="soft" label={`${historyCount} ${historyCount === 1 ? 'step' : 'steps'} in history`}>
            {historyCount}
          </Badge>
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ useUndoRedo */

type Entry<T> = { value: T; label?: string };
type History<T> = { past: Entry<T>[]; present: Entry<T>; future: Entry<T>[] };
type Action<T> =
  | { type: 'push'; next: T | ((prev: T) => T); label: string; limit: number }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; value: T };

function historyReducer<T>(h: History<T>, a: Action<T>): History<T> {
  switch (a.type) {
    case 'push': {
      const value = typeof a.next === 'function' ? (a.next as (prev: T) => T)(h.present.value) : a.next;
      if (Object.is(value, h.present.value)) return h;
      const past = [...h.past, h.present];
      return { past: past.slice(Math.max(0, past.length - a.limit)), present: { value, label: a.label }, future: [] };
    }
    case 'undo': {
      if (!h.past.length) return h;
      return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] };
    }
    case 'redo': {
      if (!h.future.length) return h;
      return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
    }
    case 'reset':
      return { past: [], present: { value: a.value }, future: [] };
    default:
      return h;
  }
}

export type UseUndoRedoOptions = {
  /** Maximum undo steps kept. Default 100. */
  limit?: number;
  /** Bind ⌘Z / Ctrl+Z, ⇧⌘Z / Ctrl+Shift+Z and Ctrl+Y on the window. Default true. Ignored while typing in a field. */
  shortcuts?: boolean;
};

export type UseUndoRedoResult<T> = {
  /** Current value. */
  value: T;
  /** Record a new state, labelled with the action that produced it ("Generate supports"). Clears redo. */
  push: (next: T | ((prev: T) => T), label: string) => void;
  undo: () => void;
  redo: () => void;
  /** Replace the value and clear history (e.g. after opening a new job). */
  reset: (value: T) => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Label of the action Undo would revert. */
  undoLabel?: string;
  /** Label of the action Redo would re-apply. */
  redoLabel?: string;
  /** Steps available to undo. */
  historyCount: number;
  /** Steps available to redo. */
  futureCount: number;
};

const isEditable = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
};

/** Linear undo history with labelled steps and the platform's undo/redo shortcuts. */
export function useUndoRedo<T>(initial: T, { limit = 100, shortcuts = true }: UseUndoRedoOptions = {}): UseUndoRedoResult<T> {
  const [history, dispatch] = useReducer(historyReducer<T>, initial, (value: T): History<T> => ({ past: [], present: { value }, future: [] }));
  const limitRef = useRef(limit);
  limitRef.current = limit;

  const push = useCallback((next: T | ((prev: T) => T), label: string) => dispatch({ type: 'push', next, label, limit: limitRef.current }), []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const reset = useCallback((value: T) => dispatch({ type: 'reset', value }), []);

  useEffect(() => {
    if (!shortcuts) return;
    const mac = detectKbdPlatform() === 'mac';
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isEditable(e.target)) return;
      const mod = mac ? e.metaKey : e.ctrlKey;
      if (!mod || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'undo' });
      } else if ((key === 'z' && e.shiftKey) || (!mac && key === 'y')) {
        e.preventDefault();
        dispatch({ type: 'redo' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcuts]);

  return useMemo(
    () => ({
      value: history.present.value,
      push,
      undo,
      redo,
      reset,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      undoLabel: history.past.length > 0 ? history.present.label : undefined,
      redoLabel: history.future[0]?.label,
      historyCount: history.past.length,
      futureCount: history.future.length,
    }),
    [history, push, undo, redo, reset],
  );
}
