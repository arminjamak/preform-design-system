import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Tooltip } from '../Tooltip/Tooltip';
import s from './ConnectionStatus.module.css';

export type Connection = 'online' | 'offline' | 'connecting' | 'degraded';

export type ConnectionStatusProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> &
  WithForcedState & {
    status: Connection;
    /** Device or service name shown before the status, e.g. "Form 4". */
    name?: ReactNode;
    /** Override the status text ("Online", "Connecting…"). */
    statusLabel?: string;
    /** Dot only; the full text moves into a tooltip and the accessible name. */
    compact?: boolean;
    size?: 'sm' | 'md';
    tooltipPlacement?: 'top' | 'bottom';
    /** Announce status changes politely (role="status"). Use for the one indicator that matters, not every row. */
    live?: boolean;
  };

const defaultStatusLabel: Record<Connection, string> = {
  online: 'Online',
  offline: 'Offline',
  connecting: 'Connecting…',
  degraded: 'Unstable connection',
};

/** Dot-and-label connection indicator for printers and cloud sync, e.g. "Form 4 · Online". */
export function ConnectionStatus({
  status,
  name,
  statusLabel,
  compact = false,
  size = 'md',
  tooltipPlacement = 'top',
  live = false,
  className,
  'data-state': state,
  ...rest
}: ConnectionStatusProps) {
  const text = statusLabel ?? defaultStatusLabel[status];
  const nameText = typeof name === 'string' || typeof name === 'number' ? String(name) : undefined;
  const full = nameText ? `${nameText} · ${text}` : text;

  if (compact) {
    return (
      <span className={cx(s.root, s[status], s[size], className)} role={live ? 'status' : undefined} {...rest}>
        <Tooltip content={name ? <>{name} · {text}</> : text} placement={tooltipPlacement}>
          <span className={s.trigger} tabIndex={0} role="img" aria-label={full} data-state={state}>
            <span className={s.dot} />
          </span>
        </Tooltip>
      </span>
    );
  }

  return (
    <span className={cx(s.root, s[status], s[size], className)} role={live ? 'status' : undefined} {...rest}>
      <span className={s.dot} aria-hidden="true" />
      {name && (
        <>
          <span className={s.name}>{name}</span>
          <span className={s.separator} aria-hidden="true">
            ·
          </span>
        </>
      )}
      <span className={s.status}>{text}</span>
    </span>
  );
}
