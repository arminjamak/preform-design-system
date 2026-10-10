import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './Fab.module.css';

export type FabTone = 'accent' | 'surface';

export type FabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  WithForcedState & {
    icon: ReactNode;
    /** Accessible name; shown as text when `extended`. */
    label: string;
    /** Pill with the label beside the icon instead of an icon-only disc. */
    extended?: boolean;
    size?: 'md' | 'lg';
    tone?: FabTone;
  };

/** Floating action button for the 3D viewport (Add model, Auto-orient): a circular disc on `elevation.popover`. */
export const Fab = forwardRef<HTMLButtonElement, FabProps>(function Fab(
  { icon, label, extended, size = 'md', tone = 'accent', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={extended ? undefined : label}
      title={extended ? undefined : label}
      className={cx(s.fab, s[size], s[tone], extended && s.extended, className)}
      {...rest}
    >
      <span className={s.icon} aria-hidden="true">
        {icon}
      </span>
      {extended && <span className={s.label}>{label}</span>}
    </button>
  );
});
