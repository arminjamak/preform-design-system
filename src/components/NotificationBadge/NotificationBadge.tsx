import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { Tone } from '../../lib/types';
import s from './NotificationBadge.module.css';

export type NotificationBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /** The element the badge is pinned to, usually a bell `IconButton`. */
  children: ReactNode;
  /** Unread count. Ignored when `dot` is set. */
  count?: number;
  /** Show a plain dot instead of a number. */
  dot?: boolean;
  /** Counts above this render as `max+`. */
  max?: number;
  /** Render the badge when `count` is 0. */
  showZero?: boolean;
  tone?: Tone;
  /**
   * Screen-reader text for the badge, e.g. "3 unread print notifications".
   * Defaults to "{count} new" / "New activity". Tip: also include the count in the trigger's own label.
   */
  label?: string;
  /** Hide the badge without unmounting the child. */
  invisible?: boolean;
};

/** Pins a count or dot to the top-right of its child: unread printer alerts on the bell, new jobs on the queue tab. */
export function NotificationBadge({
  children,
  count = 0,
  dot = false,
  max = 99,
  showZero = false,
  tone = 'danger',
  label,
  invisible = false,
  className,
  ...rest
}: NotificationBadgeProps) {
  const visible = !invisible && (dot || count > 0 || showZero);
  const text = count > max ? `${max}+` : String(count);
  const srText = label ?? (dot ? 'New activity' : `${count} new`);
  return (
    <span className={cx(s.wrap, className)} {...rest}>
      {children}
      {visible && (
        <>
          <span key={dot ? 'dot' : text} className={cx(s.badge, dot ? s.dot : s.count, s[tone])} aria-hidden="true">
            {dot ? null : text}
          </span>
          <span className={s.srOnly}>{srText}</span>
        </>
      )}
    </span>
  );
}
