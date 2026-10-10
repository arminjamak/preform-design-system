import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import { Spinner } from '../Spinner/Spinner';
import s from './Button.module.css';

export type ButtonVariant = 'primary' | 'outline' | 'outlineAccent' | 'muted' | 'ghost' | 'danger' | 'link';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  WithForcedState & {
    variant?: ButtonVariant;
    size?: Size;
    /** Pill (default) or 6px rounded corners. */
    shape?: 'pill' | 'rounded';
    fullWidth?: boolean;
    loading?: boolean;
    iconStart?: ReactNode;
    iconEnd?: ReactNode;
  };

/** The PreForm pill button. Mirrors `PillButton` from the app, extended with ghost, danger and link variants. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'outline', size = 'sm', shape = 'pill', fullWidth, loading, iconStart, iconEnd, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(s.button, s[variant], s[size], shape === 'rounded' && s.rounded, fullWidth && s.fullWidth, className)}
      {...rest}
    >
      {loading ? <Spinner size="xs" /> : iconStart ? <span className={s.icon}>{iconStart}</span> : null}
      <span className={cx(loading && s.loadingLabel)}>{children}</span>
      {iconEnd && !loading && <span className={s.icon}>{iconEnd}</span>}
    </button>
  );
});
