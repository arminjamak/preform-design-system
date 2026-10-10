import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { SmilePlusIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { IconButton } from '../IconButton/IconButton';
import { Popover } from '../Popover/Popover';
import { SearchField } from '../SearchField/SearchField';
import { Tooltip } from '../Tooltip/Tooltip';
import { EMOJI_CATEGORIES, QUICK_REACTIONS, emojiName, type EmojiEntry } from './emojiData';
import s from './ReactionPicker.module.css';

const COLUMNS = 8;

/* ------------------------------------------------------------------ */
/* ReactionPicker                                                      */
/* ------------------------------------------------------------------ */

export type ReactionPickerProps = WithForcedState & {
  onSelect: (emoji: string) => void;
  /** Accessible name of the trigger. */
  label?: string;
  /** Override the quick-reaction row (defaults to 👍 🎉 ❤️ 👀 ✅ 🚀). */
  quickReactions?: EmojiEntry[];
  /** Emoji the current user already reacted with; marked as selected in the picker. */
  selected?: string[];
  placement?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  triggerSize?: 'xs' | 'sm' | 'md';
  triggerVariant?: 'ghost' | 'outline';
  /** Controlled open state; uncontrolled when omitted. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnSelect?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Smile-plus button that opens quick reactions and a small searchable, categorised emoji grid. */
export function ReactionPicker({
  onSelect,
  label = 'Add reaction',
  quickReactions = QUICK_REACTIONS,
  selected = [],
  placement = 'bottom',
  align = 'start',
  triggerSize = 'sm',
  triggerVariant = 'ghost',
  open: openProp,
  onOpenChange,
  closeOnSelect = true,
  disabled,
  className,
  'data-state': forcedState,
}: ReactionPickerProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next);
      onOpenChange?.(next);
      if (!next) setQuery('');
    },
    [openProp, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const closeAndFocus = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, [setOpen]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const pick = (emoji: string) => {
    onSelect(emoji);
    if (closeOnSelect) closeAndFocus();
  };

  const q = query.trim().toLowerCase();
  const sections = useMemo(() => {
    if (!q) return EMOJI_CATEGORIES;
    const seen = new Set<string>();
    const hits = EMOJI_CATEGORIES.flatMap((c) => c.emoji).filter((e) => {
      if (seen.has(e.emoji)) return false;
      const match = e.name.includes(q) || (e.keywords ?? '').includes(q);
      if (match) seen.add(e.emoji);
      return match;
    });
    return [{ id: 'results', label: 'Results', emoji: hits }];
  }, [q]);

  // Arrow-key navigation across the grid; Up/Down jump a row of COLUMNS.
  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const cells = Array.from(gridRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const i = cells.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const step = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: COLUMNS,
      ArrowUp: -COLUMNS,
    }[e.key];
    if (step !== undefined) {
      e.preventDefault();
      const next = i + step;
      if (next < 0 && e.key === 'ArrowUp') searchRef.current?.focus();
      else cells[Math.max(0, Math.min(cells.length - 1, next))]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      cells[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      cells[cells.length - 1]?.focus();
    }
  };

  const onQuickKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const cells = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
    const i = cells.indexOf(document.activeElement as HTMLButtonElement);
    e.preventDefault();
    cells[(i + (e.key === 'ArrowRight' ? 1 : -1) + cells.length) % cells.length]?.focus();
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      gridRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    } else if (e.key === 'Enter') {
      const first = sections[0]?.emoji[0];
      if (q && first) {
        e.preventDefault();
        pick(first.emoji);
      }
    }
  };

  const onDialogKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && !e.defaultPrevented) {
      e.preventDefault();
      e.stopPropagation();
      closeAndFocus();
    }
  };

  const isSelected = (emoji: string) => selected.includes(emoji);
  const total = sections.reduce((n, c) => n + c.emoji.length, 0);

  return (
    <Popover
      open={open}
      onClose={close}
      placement={placement}
      align={align}
      padded={false}
      className={cx(s.anchor, className)}
      trigger={
        <IconButton
          ref={triggerRef}
          label={label}
          icon={<SmilePlusIcon strokeWidth={2.2} />}
          size={triggerSize}
          variant={triggerVariant}
          shape="circle"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          disabled={disabled}
          data-state={forcedState}
          onClick={() => setOpen(!open)}
        />
      }
    >
      <div id={dialogId} role="dialog" aria-label="Choose a reaction" className={s.picker} onKeyDown={onDialogKeyDown}>
        <div role="group" aria-label="Quick reactions" className={s.quick} onKeyDown={onQuickKeyDown}>
          {quickReactions.map((r) => (
            <button
              key={r.emoji}
              type="button"
              className={cx(s.quickEmoji, isSelected(r.emoji) && s.selected)}
              aria-label={`React with ${r.name}`}
              aria-pressed={isSelected(r.emoji)}
              title={r.name}
              onClick={() => pick(r.emoji)}
            >
              <span aria-hidden="true">{r.emoji}</span>
            </button>
          ))}
        </div>
        <div className={s.search}>
          <SearchField
            ref={searchRef}
            label="Search emoji"
            placeholder="Search emoji"
            value={query}
            onChange={setQuery}
            onKeyDown={onSearchKeyDown}
            fullWidth
          />
        </div>
        <div ref={gridRef} className={s.scroll} onKeyDown={onGridKeyDown}>
          {sections.map((c) => (
            <section key={c.id} aria-labelledby={`${dialogId}-${c.id}`} className={s.section}>
              <h3 id={`${dialogId}-${c.id}`} className={s.sectionLabel}>
                {c.label}
              </h3>
              <div className={s.grid}>
                {c.emoji.map((e) => (
                  <button
                    key={`${c.id}-${e.emoji}`}
                    type="button"
                    className={cx(s.cell, isSelected(e.emoji) && s.selected)}
                    aria-label={e.name}
                    aria-pressed={isSelected(e.emoji)}
                    title={e.name}
                    onClick={() => pick(e.emoji)}
                  >
                    <span aria-hidden="true">{e.emoji}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {total === 0 && <p className={s.empty}>No emoji match “{query.trim()}”</p>}
        </div>
        <p className={s.srOnly} aria-live="polite">
          {q ? `${total} emoji found` : ''}
        </p>
      </div>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* ReactionChip + ReactionBar                                          */
/* ------------------------------------------------------------------ */

export type Reaction = {
  emoji: string;
  count: number;
  /** The current user is one of the reactors. */
  reacted: boolean;
  /** Names of the people who reacted (excluding "you"), shown in the tooltip. */
  users?: string[];
};

export type ReactionChipProps = WithForcedState &
  Reaction & {
    onToggle: (emoji: string) => void;
    disabled?: boolean;
    className?: string;
  };

const who = (users: string[] | undefined, reacted: boolean) => {
  const list = [...(users ?? []), ...(reacted ? ['you'] : [])];
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
};

/** One existing reaction: emoji + count, pressed when you reacted. */
export function ReactionChip({ emoji, count, reacted, users, onToggle, disabled, className, 'data-state': forcedState }: ReactionChipProps) {
  const name = emojiName(emoji);
  const people = who(users, reacted);
  const chip = (
    <button
      type="button"
      aria-pressed={reacted}
      aria-label={`${name}: ${count} ${count === 1 ? 'reaction' : 'reactions'}${reacted ? ', including you' : ''}. ${reacted ? 'Remove' : 'Add'} your reaction`}
      disabled={disabled}
      data-state={forcedState}
      onClick={() => onToggle(emoji)}
      className={cx(s.chip, reacted && s.reacted, className)}
    >
      <span className={s.chipEmoji} aria-hidden="true">
        {emoji}
      </span>
      <span className={s.count} aria-hidden="true">
        {count}
      </span>
    </button>
  );
  if (!people) return chip;
  return (
    <Tooltip content={`${people} reacted with ${name}`} className={s.chipTip}>
      {chip}
    </Tooltip>
  );
}

export type ReactionBarProps = {
  reactions: Reaction[];
  onToggle: (emoji: string) => void;
  /** Shows a ReactionPicker at the end of the bar; called with the chosen emoji. */
  onAdd?: (emoji: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

/** Row of reaction chips under a comment or job note, with an add-reaction picker. */
export function ReactionBar({ reactions, onToggle, onAdd, label = 'Reactions', disabled, className }: ReactionBarProps) {
  const visible = reactions.filter((r) => r.count > 0);
  return (
    <div role="group" aria-label={label} className={cx(s.bar, className)}>
      {visible.map((r) => (
        <ReactionChip key={r.emoji} {...r} onToggle={onToggle} disabled={disabled} />
      ))}
      {onAdd && (
        <ReactionPicker
          onSelect={onAdd}
          selected={visible.filter((r) => r.reacted).map((r) => r.emoji)}
          triggerSize="sm"
          triggerVariant="outline"
          disabled={disabled}
        />
      )}
    </div>
  );
}
