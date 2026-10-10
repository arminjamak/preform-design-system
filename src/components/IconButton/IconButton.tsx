import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './IconButton.module.css';

export type IconButtonVariant = 'ghost' | 'outline' | 'accentOutline' | 'filled' | 'floating' | 'inverse';

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  WithForcedState & {
    /** Accessible name. Required because the button has no visible text. */
    label: string;
    icon: ReactNode;
    variant?: IconButtonVariant;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    shape?: 'rounded' | 'circle';
    pressed?: boolean;
  };

/** Square or circular icon-only button: close buttons, menu triggers, floating viewport controls. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'ghost', size = 'sm', shape = 'rounded', pressed, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cx(s.button, s[variant], s[size], shape === 'circle' && s.circle, pressed && s.pressed, className)}
      {...rest}
    >
      {icon}
    </button>
  );
});
