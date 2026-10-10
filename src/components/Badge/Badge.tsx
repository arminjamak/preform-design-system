import type { ReactNode } from 'react';
import { CheckIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Tone } from '../../lib/types';
import s from './Badge.module.css';

export type BadgeProps = {
  children?: ReactNode;
  tone?: Tone;
  variant?: 'solid' | 'soft' | 'outline';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  /** Accessible label when the badge is icon-only (e.g. the green pass check). */
  label?: string;
  className?: string;
};

/** Pill label: the "Current" history marker, validation pass check, counts. */
export function Badge({ children, tone = 'neutral', variant = 'soft', size = 'sm', icon, label, className }: BadgeProps) {
  const dotOnly = !children && !!icon;
  return (
    <span className={cx(s.badge, s[tone], s[variant], s[size], dotOnly && s.dotOnly, className)} aria-label={label} role={label ? 'img' : undefined}>
      {icon}
      {children}
    </span>
  );
}

/** Convenience: the green check badge from the validation sidebar. */
export function PassBadge({ label = 'Passed', size = 'sm' }: { label?: string; size?: 'sm' | 'md' }) {
  return <Badge tone="success" variant="solid" size={size} icon={<CheckIcon strokeWidth={3.5} />} label={label} />;
}
