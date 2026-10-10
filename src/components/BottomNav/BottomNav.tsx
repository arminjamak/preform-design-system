import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Badge } from '../Badge/Badge';
import s from './BottomNav.module.css';

const formatBadge = (n: number) => (n > 99 ? '99+' : String(n));

export type BottomNavButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  WithForcedState & {
    icon: ReactNode;
    label: string;
    active?: boolean;
    /** Count shown on the icon; hidden when 0 or undefined. */
    badge?: number;
  };

/** Icon-over-label destination of the mobile bottom bar. */
export const BottomNavButton = forwardRef<HTMLButtonElement, BottomNavButtonProps>(function BottomNavButton(
  { icon, label, active, badge, className, type = 'button', ...rest },
  ref,
) {
  const hasBadge = badge !== undefined && badge > 0;
  return (
    <button
      ref={ref}
      type={type}
      aria-current={active ? 'page' : undefined}
      aria-label={hasBadge ? `${label}, ${badge} new` : undefined}
      className={cx(s.item, active && s.active, className)}
      {...rest}
    >
      <span className={s.iconWrap} aria-hidden="true">
        {icon}
        {hasBadge && (
          <Badge tone="danger" variant="solid" size="sm" className={s.badge}>
            {formatBadge(badge)}
          </Badge>
        )}
      </span>
      <span className={s.label}>{label}</span>
    </button>
  );
});

export type BottomNavItem<T extends string = string> = { value: T; label: string; icon: ReactNode; badge?: number; disabled?: boolean };

export type BottomNavProps<T extends string = string> = Omit<HTMLAttributes<HTMLElement>, 'onChange'> &
  WithForcedState & {
    /** 3–5 top-level destinations. */
    items: BottomNavItem<T>[];
    value: T;
    onChange: (value: T) => void;
    /** Accessible name of the navigation landmark. */
    label?: string;
  };

/** Mobile bottom navigation bar with 3–5 destinations; pads for the device safe area. */
export function BottomNav<T extends string>({ items, value, onChange, label = 'Primary', className, 'data-state': state, ...rest }: BottomNavProps<T>) {
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  };

  return (
    <nav aria-label={label} className={cx(s.bar, className)} onKeyDown={onKeyDown} {...rest}>
      {items.map((item, i) => (
        <BottomNavButton
          key={item.value}
          icon={item.icon}
          label={item.label}
          badge={item.badge}
          disabled={item.disabled}
          active={item.value === value}
          data-state={i === 1 ? state : undefined}
          onClick={() => onChange(item.value)}
        />
      ))}
    </nav>
  );
}
