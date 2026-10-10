import type { HTMLAttributes, ReactNode } from 'react';
import { BoxIcon, CheckCircle2Icon, CircleAlertIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import s from './EmptyState.module.css';

export type EmptyStateTone = 'empty' | 'error' | 'success';

export type EmptyStateProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  /** Drives the disc colours and the default icon. */
  tone?: EmptyStateTone;
  size?: 'sm' | 'md';
  /** Override the default tone icon. */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Usually a primary `Button`. */
  primaryAction?: ReactNode;
  /** Usually an outline or ghost `Button`. */
  secondaryAction?: ReactNode;
  /** Heading level for the title. */
  titleAs?: 'h2' | 'h3' | 'h4' | 'p';
};

const defaultIcon: Record<EmptyStateTone, ReactNode> = {
  empty: <BoxIcon strokeWidth={1.8} />,
  error: <CircleAlertIcon strokeWidth={1.8} />,
  success: <CheckCircle2Icon strokeWidth={1.8} />,
};

/** Centered placeholder for empty, failed or completed views: tinted icon disc, title, description and actions. */
export function EmptyState({
  tone = 'empty',
  size = 'md',
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  titleAs: Title = 'h3',
  className,
  children,
  ...rest
}: EmptyStateProps) {
  return (
    <div className={cx(s.root, s[size], s[tone], className)} {...rest}>
      <span className={s.disc} aria-hidden="true">
        {icon ?? defaultIcon[tone]}
      </span>
      <div className={s.text}>
        <Title className={s.title}>{title}</Title>
        {description && <p className={s.description}>{description}</p>}
      </div>
      {children}
      {(primaryAction || secondaryAction) && (
        <div className={s.actions}>
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
