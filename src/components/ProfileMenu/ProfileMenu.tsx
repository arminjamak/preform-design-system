import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon, CircleHelpIcon, KeyboardIcon, LogOutIcon, MoonIcon, PrinterIcon, SettingsIcon, UserRoundIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Popover } from '../Popover/Popover';
import { AvatarWithPresence, PresenceIndicator, presenceText, type PresenceStatus } from '../PresenceIndicator/PresenceIndicator';
import s from './ProfileMenu.module.css';

export type ProfileUser = {
  name: string;
  email: string;
  org?: string;
  /** Avatar image URL; initials are used when absent. */
  avatar?: string;
};

export type ProfileMenuItem = {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
};

export type ProfileMenuProps = WithForcedState & {
  user: ProfileUser;
  status: PresenceStatus;
  onStatusChange: (status: PresenceStatus) => void;
  /** Replaces the default Profile / Printers / Account settings / Keyboard shortcuts / Help items. */
  items?: ProfileMenuItem[];
  /** Called with the default item's label when one of the built-in items is chosen. */
  onItemSelect?: (label: string) => void;
  onSignOut: () => void;
  /** `inverse` sits on the dark app bar, `light` on surfaces and panels. */
  variant?: 'light' | 'inverse';
  /** Avatar-only trigger instead of the full name + email chip. */
  compact?: boolean;
  /** Current theme; the theme row is shown only when `onThemeChange` is set. */
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
  /** Controlled open state; uncontrolled when omitted. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'end';
  disabled?: boolean;
  className?: string;
};

const STATUS_OPTIONS: Array<{
  value: PresenceStatus;
  label: string;
  hint: string;
}> = [
  { value: 'online', label: 'Online', hint: 'Visible to your team' },
  { value: 'away', label: 'Away', hint: 'Shown after 10 min idle' },
  { value: 'busy', label: 'Do not disturb', hint: 'Mute print notifications' },
  { value: 'offline', label: 'Appear offline', hint: 'Hide your cursor' },
];

const ICON = { strokeWidth: 2.2, 'aria-hidden': true } as const;

const defaultItems = (onItemSelect?: (label: string) => void): ProfileMenuItem[] =>
  [
    { label: 'Profile', icon: <UserRoundIcon {...ICON} /> },
    { label: 'Printers', icon: <PrinterIcon {...ICON} /> },
    { label: 'Account settings', icon: <SettingsIcon {...ICON} /> },
    {
      label: 'Keyboard shortcuts',
      icon: <KeyboardIcon {...ICON} />,
      shortcut: '⌘/',
    },
    { label: 'Help', icon: <CircleHelpIcon {...ICON} /> },
  ].map((i) => ({ ...i, onSelect: () => onItemSelect?.(i.label) }));

const ITEM_SELECTOR = '[role^="menuitem"]:not(:disabled)';

/** Account chip that opens the profile menu: identity header, presence, account links, theme and sign out. */
export function ProfileMenu({
  user,
  status,
  onStatusChange,
  items,
  onItemSelect,
  onSignOut,
  variant = 'light',
  compact = false,
  theme,
  onThemeChange,
  open: openProp,
  onOpenChange,
  align = 'end',
  disabled,
  className,
  'data-state': forcedState,
}: ProfileMenuProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const headerId = useId();

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const closeAndFocus = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, [setOpen]);

  const focusItem = (which: 'first' | 'last' | number) => {
    const list = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
    if (!list.length) return;
    const idx = which === 'first' ? 0 : which === 'last' ? list.length - 1 : (which + list.length) % list.length;
    list[idx].focus();
  };

  // Move focus into the menu when it opens (keyboard and pointer alike).
  useEffect(() => {
    if (open) focusItem('first');
  }, [open]);

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
    const current = list.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusItem(current + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusItem(current < 0 ? -1 : current - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusItem('first');
        break;
      case 'End':
        e.preventDefault();
        focusItem('last');
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        closeAndFocus();
        break;
      case 'Tab':
        close();
        break;
    }
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const run = (fn: () => void) => () => {
    fn();
    closeAndFocus();
  };

  const statusText = presenceText(status);
  const list = items ?? defaultItems(onItemSelect);

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      aria-label={`Account: ${user.name}, ${user.email}, ${statusText}`}
      disabled={disabled}
      data-state={forcedState}
      onClick={() => setOpen(!open)}
      onKeyDown={onTriggerKeyDown}
      className={cx(s.trigger, s[variant], compact ? s.compact : s.full)}
    >
      <AvatarWithPresence
        name={user.name}
        src={user.avatar}
        status={status}
        size={compact ? 'sm' : 'xs'}
        ring={variant === 'inverse' ? 'inverse' : 'surface'}
      />
      {!compact && (
        <span className={s.triggerText} aria-hidden="true">
          <span className={s.triggerName}>{user.name}</span>
          <span className={s.triggerEmail}>{user.email}</span>
        </span>
      )}
      {!compact && <ChevronDownIcon className={s.chevron} strokeWidth={2.4} aria-hidden="true" />}
    </button>
  );

  return (
    <Popover open={open} onClose={close} trigger={trigger} placement="bottom" align={align} padded={false} className={cx(s.anchor, className)}>
      <div ref={menuRef} id={menuId} role="menu" aria-labelledby={headerId} className={s.menu} onKeyDown={onMenuKeyDown}>
        <div className={s.header} role="none">
          <AvatarWithPresence name={user.name} src={user.avatar} status={status} size="md" />
          <div className={s.identity}>
            <span id={headerId} className={s.name}>
              {user.name}
            </span>
            <span className={s.email}>{user.email}</span>
            {user.org && <span className={s.org}>{user.org}</span>}
          </div>
        </div>

        <div role="separator" className={s.separator} />
        <div role="group" aria-label="Status" className={s.group}>
          <span className={s.groupLabel} aria-hidden="true">
            Status
          </span>
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={status === o.value}
              tabIndex={-1}
              className={cx(s.item, status === o.value && s.selected)}
              onClick={run(() => onStatusChange(o.value))}
            >
              <PresenceIndicator status={o.value} size="sm" ring="none" decorative />
              <span className={s.itemText}>
                {o.label}
                <span className={s.hint}>{o.hint}</span>
              </span>
              {status === o.value && <CheckIcon className={s.check} strokeWidth={2.6} aria-hidden="true" />}
            </button>
          ))}
        </div>

        <div role="separator" className={s.separator} />
        <div role="group" aria-label="Account" className={s.group}>
          {list.map((item) => (
            <button key={item.label} type="button" role="menuitem" tabIndex={-1} disabled={item.disabled} className={s.item} onClick={run(item.onSelect)}>
              {item.icon && <span className={s.icon}>{item.icon}</span>}
              <span className={s.itemText}>{item.label}</span>
              {item.shortcut && <kbd className={s.shortcut}>{item.shortcut}</kbd>}
            </button>
          ))}
        </div>

        {onThemeChange && (
          <>
            <div role="separator" className={s.separator} />
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={theme === 'dark'}
              tabIndex={-1}
              className={s.item}
              onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            >
              <span className={s.icon}>
                <MoonIcon {...ICON} />
              </span>
              <span className={s.itemText}>Dark theme</span>
              <span className={s.switch} aria-hidden="true">
                <span className={s.thumb} />
              </span>
            </button>
          </>
        )}

        <div role="separator" className={s.separator} />
        <button type="button" role="menuitem" tabIndex={-1} className={cx(s.item, s.danger)} onClick={run(onSignOut)}>
          <span className={s.icon}>
            <LogOutIcon {...ICON} />
          </span>
          <span className={s.itemText}>Sign out</span>
        </button>
      </div>
    </Popover>
  );
}
