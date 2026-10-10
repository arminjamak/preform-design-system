import type { ReactNode } from 'react';
import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon, OctagonAlertIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './Callout.module.css';

export type CalloutTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type CalloutProps = WithForcedState & {
  tone?: CalloutTone;
  /** `soft` is a tinted box; `strip` is the full-width row with a coloured left edge. */
  variant?: 'soft' | 'strip';
  title?: string;
  children?: ReactNode;
  icon?: ReactNode | false;
  action?: ReactNode;
  onClick?: () => void;
  className?: string;
};

const defaultIcon: Record<CalloutTone, ReactNode> = {
  neutral: <InfoIcon strokeWidth={2} />,
  info: <InfoIcon strokeWidth={2} />,
  success: <CheckCircle2Icon strokeWidth={2} />,
  warning: <AlertTriangleIcon strokeWidth={2} />,
  danger: <OctagonAlertIcon strokeWidth={2} />,
};

/** Inline status message: "Ready to print", validation warnings, AI protect hints. */
export function Callout({ tone = 'info', variant = 'soft', title, children, icon, action, onClick, className, ...rest }: CalloutProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} role={!onClick ? 'status' : undefined} className={cx(s.callout, s[variant], s[tone], onClick && s.interactive, className)} {...rest}>
      {icon !== false && <span className={s.icon}>{icon ?? defaultIcon[tone]}</span>}
      <span className={s.content}>
        {title && <span className={s.title}>{title}</span>}
        {children}
      </span>
      {action && <span className={s.action}>{action}</span>}
    </Tag>
  );
}
