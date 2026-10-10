import type { HTMLAttributes, ReactNode } from 'react';
import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon, OctagonAlertIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import s from './Banner.module.css';

export type BannerTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type BannerProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  tone?: BannerTone;
  /** `soft` is a tinted wash with a hairline; `solid` is a full-strength fill. */
  variant?: 'soft' | 'solid';
  /** Override the tone icon, or `false` to hide it. */
  icon?: ReactNode | false;
  title?: ReactNode;
  description?: ReactNode;
  /** Buttons rendered at the end of the bar (e.g. "Update now"). */
  actions?: ReactNode;
  /** Shows a close button that calls `onDismiss`. The parent decides whether to unmount. */
  dismissible?: boolean;
  onDismiss?: () => void;
  dismissLabel?: string;
  /** Stick to the top of the scroll container. */
  sticky?: boolean;
};

const defaultIcon: Record<BannerTone, ReactNode> = {
  neutral: <InfoIcon strokeWidth={2} />,
  info: <InfoIcon strokeWidth={2} />,
  success: <CheckCircle2Icon strokeWidth={2} />,
  warning: <AlertTriangleIcon strokeWidth={2} />,
  danger: <OctagonAlertIcon strokeWidth={2} />,
};

/** Edge-to-edge, square-cornered bar at the top of a view: firmware updates, offline mode, account notices. */
export function Banner({
  tone = 'info',
  variant = 'soft',
  icon,
  title,
  description,
  actions,
  dismissible,
  onDismiss,
  dismissLabel = 'Dismiss banner',
  sticky,
  className,
  role,
  children,
  ...rest
}: BannerProps) {
  const glyph = icon === false ? null : icon ?? defaultIcon[tone];
  const urgent = tone === 'warning' || tone === 'danger';
  return (
    <div role={role ?? (urgent ? 'alert' : 'status')} className={cx(s.banner, s[variant], s[tone], sticky && s.sticky, className)} {...rest}>
      <div className={s.main}>
        {glyph && (
          <span className={s.icon} aria-hidden="true">
            {glyph}
          </span>
        )}
        <div className={s.text}>
          {title && <span className={s.title}>{title}</span>}
          {description && <span className={s.description}>{description}</span>}
          {children}
        </div>
      </div>
      {(actions || dismissible) && (
        <div className={s.end}>
          {actions && <div className={s.actions}>{actions}</div>}
          {dismissible && <IconButton className={s.dismiss} size="sm" label={dismissLabel} icon={<XIcon strokeWidth={2} />} onClick={onDismiss} />}
        </div>
      )}
    </div>
  );
}
