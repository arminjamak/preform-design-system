import { useId, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { useOverlayBehavior, usePresence } from '../Sheet/overlay';
import s from './FullScreenDialog.module.css';

export type FullScreenDialogAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export type FullScreenDialogProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> & {
  open: boolean;
  onRequestClose: () => void;
  title: string;
  /** Muted text under the title, e.g. "Step 2 of 5 · Network". */
  subtitle?: string;
  children: ReactNode;
  /** Pill button at the right of the top bar (Continue, Finish, Save). */
  primaryAction?: FullScreenDialogAction;
  /** Extra top-bar controls placed before the primary action (Back, Help). */
  secondaryActions?: ReactNode;
  /** Centred content under the top bar, e.g. a horizontal Stepper. */
  progress?: ReactNode;
  /** Optional bottom bar (Back / Skip on multi-step flows). */
  footer?: ReactNode;
  /** Max width of the centred content column. */
  contentWidth?: 'sm' | 'md' | 'lg' | 'full';
  closeLabel?: string;
  initialFocusRef?: RefObject<HTMLElement>;
  /** Render in place instead of portalling to <body> (docs and tests). */
  inline?: boolean;
  className?: string;
};

/** Full-viewport dialog for multi-step flows such as "Set up Form 4": close, title and primary action in a top bar, a centred scrolling body. */
export function FullScreenDialog({
  open,
  onRequestClose,
  title,
  subtitle,
  children,
  primaryAction,
  secondaryActions,
  progress,
  footer,
  contentWidth = 'md',
  closeLabel = 'Close',
  initialFocusRef,
  inline,
  className,
  ...rest
}: FullScreenDialogProps) {
  const titleId = useId();
  const subId = useId();
  const { mounted, state } = usePresence(open);
  const { ref, onKeyDown } = useOverlayBehavior<HTMLDivElement>({ open, onClose: onRequestClose, inline, initialFocusRef });
  if (!mounted) return null;

  const node = (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subId : undefined}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      data-presence={state}
      className={cx(s.root, inline && s.inline, className)}
      {...rest}
    >
      <header className={s.bar}>
        <IconButton label={closeLabel} icon={<XIcon strokeWidth={2.6} />} size="md" onClick={onRequestClose} />
        <div className={s.titles}>
          <h2 id={titleId} className={s.title}>
            {title}
          </h2>
          {subtitle && (
            <p id={subId} className={s.subtitle}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={s.actions}>
          {secondaryActions}
          {primaryAction && (
            <Button variant="primary" size="md" onClick={primaryAction.onClick} disabled={primaryAction.disabled} loading={primaryAction.loading}>
              {primaryAction.label}
            </Button>
          )}
        </div>
      </header>
      {progress && <div className={s.progress}>{progress}</div>}
      <div className={s.body}>
        <div className={cx(s.content, s[contentWidth])}>{children}</div>
      </div>
      {footer && (
        <footer className={s.footer}>
          <div className={cx(s.footerInner, s[contentWidth])}>{footer}</div>
        </footer>
      )}
    </div>
  );
  return inline ? node : createPortal(node, document.body);
}
