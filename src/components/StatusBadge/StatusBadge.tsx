import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './StatusBadge.module.css';

export type PrintStatus = 'printing' | 'queued' | 'paused' | 'complete' | 'failed' | 'offline';

export type StatusBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  status: PrintStatus;
  /** Custom text, e.g. "Printing · 42%". Defaults to the status name. */
  label?: ReactNode;
  size?: 'sm' | 'md';
  /** Animate the dot. Defaults to true for `printing`. Disabled under prefers-reduced-motion. */
  pulse?: boolean;
};

const defaultLabel: Record<PrintStatus, string> = {
  printing: 'Printing',
  queued: 'Queued',
  paused: 'Paused',
  complete: 'Complete',
  failed: 'Failed',
  offline: 'Offline',
};

/** Pill with a leading status dot for print jobs and printers in the queue and dashboard. */
export function StatusBadge({ status, label, size = 'sm', pulse, className, ...rest }: StatusBadgeProps) {
  const animate = pulse ?? status === 'printing';
  return (
    <span className={cx(s.badge, s[status], s[size], className)} {...rest}>
      <span className={cx(s.dot, animate && s.pulse)} aria-hidden="true" />
      {label ?? defaultLabel[status]}
    </span>
  );
}
