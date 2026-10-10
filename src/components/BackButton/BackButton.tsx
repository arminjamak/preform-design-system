import type { MouseEvent } from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './BackButton.module.css';

export type BackButtonProps = WithForcedState & {
  /** Visible text, e.g. "Back to Projects". */
  label?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Renders a link instead of a button. */
  href?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
};

/** Compact ghost "← Back to Projects" control for drill-in panels and settings pages. Hints the browser's Alt+Left shortcut via its tooltip. */
export function BackButton({ label = 'Back', onClick, href, size = 'sm', disabled, className, 'data-state': state }: BackButtonProps) {
  const content = (
    <>
      <span className={s.icon} aria-hidden="true">
        <ArrowLeftIcon strokeWidth={2.2} />
      </span>
      <span>{label}</span>
    </>
  );
  const common = { className: cx(s.button, s[size], className), title: `${label} (Alt+Left)`, 'data-state': state };

  if (href) {
    return (
      <a
        {...common}
        href={disabled ? undefined : href}
        role={disabled ? 'link' : undefined}
        aria-disabled={disabled || undefined}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
      >
        {content}
      </a>
    );
  }
  return (
    <button {...common} type="button" disabled={disabled} onClick={onClick}>
      {content}
    </button>
  );
}
