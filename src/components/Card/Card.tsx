import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './Card.module.css';

export type CardProps = HTMLAttributes<HTMLDivElement> &
  WithForcedState & {
    variant?: 'outline' | 'elevated' | 'subtle';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    /** Hover and focus affordances; renders as a button when `onClick` is set. */
    interactive?: boolean;
    selected?: boolean;
    dragging?: boolean;
  };

/** Bordered surface: profile cards, printer/job settings block, texture tiles. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ variant = 'outline', padding = 'md', interactive, selected, dragging, className, ...rest }, ref) {
  return <div ref={ref} className={cx(s.card, s[variant], s[padding], interactive && s.interactive, selected && s.selected, dragging && s.dragging, className)} {...rest} />;
});
