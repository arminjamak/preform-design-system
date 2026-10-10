import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { MoreHorizontalIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Menu, type MenuItem } from '../Menu/Menu';
import s from './BulkActionBar.module.css';

export type BulkAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  /** Destructive: rendered as the red pill and always kept out of the overflow menu. */
  danger?: boolean;
  disabled?: boolean;
  /** Shown in the overflow menu, e.g. "⌘D". */
  shortcut?: string;
};

export type BulkActionBarProps = WithForcedState & {
  /** Number of selected items. The bar slides in when it becomes > 0 and out when it returns to 0. */
  count: number;
  /** Overrides the "3 models selected" text. */
  label?: ReactNode;
  /** Singular and plural noun used in the default label. */
  noun?: { one: string; other: string };
  actions: BulkAction[];
  /** Non-danger actions shown as buttons; the rest go in the ⋯ menu. */
  maxVisible?: number;
  onClear: () => void;
  /** Edge the floating bar docks to (inside the nearest positioned ancestor). */
  position?: 'bottom' | 'top';
  /** Render in normal flow instead of floating over the viewport. */
  inline?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Multi-select toolbar: a floating pill that appears while items are selected, with the selection count,
 * the main bulk actions, an overflow menu and a clear button. Arrow keys move between controls; Escape clears.
 */
export function BulkActionBar({
  count,
  label,
  noun = { one: 'item', other: 'items' },
  actions,
  maxVisible = 3,
  onClear,
  position = 'bottom',
  inline,
  disabled,
  className,
  'data-state': state,
}: BulkActionBarProps) {
  const visible = count > 0;
  const [mounted, setMounted] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  const shownCount = useRef(count);
  if (count > 0) shownCount.current = count;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setLeaving(false);
    } else {
      setLeaving(true);
    }
  }, [visible]);

  if (!mounted) return null;

  const n = shownCount.current;
  const regular = actions.filter((a) => !a.danger);
  const danger = actions.filter((a) => a.danger);
  const shown = regular.slice(0, maxVisible);
  const overflow = regular.slice(maxVisible);
  const menuItems: MenuItem[] = overflow.map((a) => ({ label: a.label, icon: a.icon, onSelect: a.onClick, disabled: disabled || a.disabled, shortcut: a.shortcut }));

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('[role="menu"]') || target.getAttribute('aria-expanded') === 'true') return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onClear();
      return;
    }
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    const focusables = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []).filter((b) => !b.closest('[role="menu"]'));
    const i = focusables.indexOf(target as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? focusables.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + focusables.length) % focusables.length;
    focusables[next]?.focus();
  };

  let forced = state;
  const takeState = () => {
    const v = forced;
    forced = undefined;
    return v;
  };

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Selection actions"
      aria-orientation="horizontal"
      className={cx(s.bar, inline ? s.inline : s.floating, s[position], leaving && s.leaving, className)}
      onKeyDown={onKeyDown}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && leaving) {
          setMounted(false);
          setLeaving(false);
        }
      }}
    >
      <span className={s.count} role="status" aria-live="polite">
        {label ?? (
          <>
            <span className={s.number}>{n}</span> {n === 1 ? noun.one : noun.other} selected
          </>
        )}
      </span>
      <span className={s.divider} aria-hidden="true" />
      <span className={s.actions}>
        {shown.map((a) => (
          <Button key={a.id} variant="ghost" iconStart={a.icon} onClick={a.onClick} disabled={disabled || a.disabled} data-state={takeState()}>
            {a.label}
          </Button>
        ))}
        {overflow.length > 0 && <Menu label="More actions" icon={<MoreHorizontalIcon strokeWidth={2.4} />} items={menuItems} placement={position === 'bottom' ? 'top' : 'bottom'} align="end" />}
        {danger.map((a) => (
          <Button key={a.id} variant="danger" iconStart={a.icon} onClick={a.onClick} disabled={disabled || a.disabled} data-state={takeState()}>
            {a.label}
          </Button>
        ))}
      </span>
      <span className={s.divider} aria-hidden="true" />
      <IconButton label="Clear selection" icon={<XIcon strokeWidth={2.4} />} shape="circle" onClick={onClear} disabled={disabled} />
    </div>
  );
}
