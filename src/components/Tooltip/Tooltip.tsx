import { useId, type ReactNode } from 'react';
import { InfoIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './Tooltip.module.css';

export type TooltipProps = WithForcedState & {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom';
  /** Force the bubble visible (used by docs and tests). */
  open?: boolean;
  className?: string;
};

/** CSS-driven tooltip shown on hover and keyboard focus of its child. */
export function Tooltip({ content, children, placement = 'top', open, className, ...rest }: TooltipProps) {
  const id = useId();
  return (
    <span className={cx(s.wrap, className)} data-open={open || undefined} aria-describedby={id} {...rest}>
      {children}
      <span role="tooltip" id={id} className={cx(s.bubble, s[placement])}>
        {content}
      </span>
    </span>
  );
}

export type InfoTipProps = Omit<TooltipProps, 'children' | 'content'> & { label: string };

/** The small `(i)` glyph beside section titles and field labels. */
export function InfoTip({ label, ...rest }: InfoTipProps) {
  return (
    <Tooltip content={label} {...rest}>
      <button type="button" aria-label={label} className={s.infoTrigger}>
        <InfoIcon strokeWidth={1.8} />
      </button>
    </Tooltip>
  );
}
