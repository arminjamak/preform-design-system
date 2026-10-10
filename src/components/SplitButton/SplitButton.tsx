import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import { Button } from '../Button/Button';
import { MenuList, type MenuItem } from '../Menu/Menu';
import { Popover } from '../Popover/Popover';
import { focusMenuItem, handleMenuKeyDown } from './menuKeyboard';
import s from './SplitButton.module.css';

export type SplitButtonVariant = 'primary' | 'outline' | 'muted';

export type SplitButtonProps = WithForcedState & {
  /** Visible label of the main action. */
  label: string;
  /** Runs the main action. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Secondary actions shown in the attached menu. */
  items: MenuItem[];
  variant?: SplitButtonVariant;
  size?: Size;
  disabled?: boolean;
  /** Shows a spinner on the main half and disables both halves. */
  loading?: boolean;
  iconStart?: ReactNode;
  /** Accessible name for the chevron trigger. Defaults to "More <label> options". */
  menuLabel?: string;
  /** Which side the menu opens on. */
  placement?: 'top' | 'bottom';
  className?: string;
};

/**
 * Primary action with an attached chevron that opens a menu of related actions
 * (Generate Supports ▾). One shared pill, a token-coloured divider between halves.
 */
export function SplitButton({
  label,
  onClick,
  items,
  variant = 'primary',
  size = 'sm',
  disabled,
  loading,
  iconStart,
  menuLabel,
  placement = 'bottom',
  className,
  'data-state': state,
}: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusTarget = useRef<'first' | 'last'>('first');
  const menuId = useId();
  const inactive = disabled || loading;

  const close = useCallback(() => setOpen(false), []);
  const dismiss = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (open) focusMenuItem(menuRef.current, focusTarget.current);
  }, [open]);

  useEffect(() => {
    if (inactive) setOpen(false);
  }, [inactive]);

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    focusTarget.current = e.key === 'ArrowDown' ? 'first' : 'last';
    if (open) focusMenuItem(menuRef.current, focusTarget.current);
    else setOpen(true);
  };

  return (
    <div role="group" aria-label={label} className={cx(s.root, s[variant], className)}>
      <Button
        variant={variant}
        size={size}
        iconStart={iconStart}
        loading={loading}
        disabled={disabled}
        data-state={state}
        onClick={onClick}
        className={s.main}
      >
        {label}
      </Button>
      <Popover
        open={open}
        onClose={close}
        placement={placement}
        align="end"
        padded={false}
        className={s.anchor}
        trigger={
          <Button
            ref={triggerRef}
            variant={variant}
            size={size}
            disabled={inactive}
            aria-label={menuLabel ?? `More ${label} options`}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            onClick={() => {
              focusTarget.current = 'first';
              setOpen((o) => !o);
            }}
            onKeyDown={onTriggerKeyDown}
            className={cx(s.trigger, open && s.open)}
          >
            <ChevronDownIcon strokeWidth={2.4} aria-hidden="true" />
          </Button>
        }
      >
        <div ref={menuRef} id={menuId} onKeyDown={(e) => handleMenuKeyDown(e, { onEscape: dismiss, onTab: dismiss })}>
          <MenuList items={items} onSelect={dismiss} />
        </div>
      </Popover>
    </div>
  );
}
