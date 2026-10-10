import { Fragment, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import s from './EditorToolbar.module.css';

export type EditorToolbarAction = {
  id: string;
  label: string;
  icon: ReactNode;
  /** Single key used with Ctrl / ⌘, e.g. `B`. Shown in the tooltip and exposed via aria-keyshortcuts. */
  shortcutKey?: string;
  /** Toggle state. Leave undefined for one-shot commands (no aria-pressed). */
  pressed?: boolean;
  disabled?: boolean;
  /** Draws a divider before this button. */
  groupStart?: boolean;
  onAction: () => void;
};

export type EditorToolbarProps = {
  /** Accessible name of the toolbar, e.g. "Formatting". */
  label: string;
  actions: EditorToolbarAction[];
  disabled?: boolean;
  className?: string;
};

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Formatting toolbar with roving tab index (Arrow keys, Home, End). Buttons never steal focus from the editor. */
export function EditorToolbar({ label, actions, disabled, className }: EditorToolbarProps) {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const mac = isMac();

  const focusAt = (index: number) => {
    const buttons = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    if (!buttons.length) return;
    const next = (index + buttons.length) % buttons.length;
    buttons[next].focus();
    setActive(actions.findIndex((a) => a.id === buttons[next].dataset.action));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    if (e.key === 'ArrowRight') focusAt(current + 1);
    else if (e.key === 'ArrowLeft') focusAt(current - 1);
    else if (e.key === 'Home') focusAt(0);
    else if (e.key === 'End') focusAt(buttons.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={root} role="toolbar" aria-label={label} aria-disabled={disabled || undefined} className={cx(s.toolbar, className)} onKeyDown={onKeyDown}>
      {actions.map((a, i) => (
        <Fragment key={a.id}>
          {a.groupStart && i > 0 && <span className={s.divider} aria-hidden />}
          <IconButton
            label={a.label}
            title={a.shortcutKey ? `${a.label} (${mac ? '⌘' : 'Ctrl+'}${a.shortcutKey})` : a.label}
            aria-keyshortcuts={a.shortcutKey ? `Control+${a.shortcutKey} Meta+${a.shortcutKey}` : undefined}
            icon={a.icon}
            size="sm"
            pressed={a.pressed}
            disabled={disabled || a.disabled}
            data-action={a.id}
            tabIndex={i === Math.max(active, 0) ? 0 : -1}
            onMouseDown={(e) => e.preventDefault()}
            onFocus={() => setActive(i)}
            onClick={a.onAction}
          />
        </Fragment>
      ))}
    </div>
  );
}

/** True when the event is Ctrl (or ⌘ on macOS) + `key` without Alt. */
export function isShortcut(e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }, key: string) {
  return (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === key.toLowerCase();
}
