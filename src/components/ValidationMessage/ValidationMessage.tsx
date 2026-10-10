import type { HTMLAttributes, ReactNode } from 'react';
import { AlertTriangleIcon, CheckCircle2Icon, CircleAlertIcon, InfoIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import s from './ValidationMessage.module.css';

export type ValidationTone = 'error' | 'warning' | 'success' | 'info';

export type ValidationMessageProps = HTMLAttributes<HTMLDivElement> & {
  tone?: ValidationTone;
  /** The message. Keep the component mounted and swap this, so the polite live region announces the change. */
  children?: ReactNode;
  /** Override the tone icon, or `false` to hide it. */
  icon?: ReactNode | false;
};

const defaultIcon: Record<ValidationTone, ReactNode> = {
  error: <CircleAlertIcon strokeWidth={2} />,
  warning: <AlertTriangleIcon strokeWidth={2} />,
  success: <CheckCircle2Icon strokeWidth={2} />,
  info: <InfoIcon strokeWidth={2} />,
};

/** Spoken before the message so the tone does not rely on colour and icon alone. */
const srPrefix: Record<ValidationTone, string> = { error: 'Error: ', warning: 'Warning: ', success: '', info: '' };

/**
 * Inline message under a field. Give it an `id` and point the field's `aria-describedby` at it.
 * Renders nothing visible when empty but stays in the DOM as a polite live region.
 */
export function ValidationMessage({ tone = 'error', children, icon, className, ...rest }: ValidationMessageProps) {
  const hasContent = children !== undefined && children !== null && children !== false && children !== '';
  const glyph = icon === false ? null : icon ?? defaultIcon[tone];
  return (
    <div aria-live="polite" aria-atomic="true" className={cx(s.root, s[tone], className)} {...rest}>
      {hasContent && (
        <>
          {glyph && (
            <span className={s.icon} aria-hidden="true">
              {glyph}
            </span>
          )}
          <span className={s.text}>
            {srPrefix[tone] && <span className={s.srOnly}>{srPrefix[tone]}</span>}
            {children}
          </span>
        </>
      )}
    </div>
  );
}
