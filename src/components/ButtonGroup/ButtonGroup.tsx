import { Children, cloneElement, isValidElement, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { Size } from '../../lib/types';
import s from './ButtonGroup.module.css';

export type ButtonGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Buttons, IconButtons or ToggleButtons. */
  children: ReactNode;
  /** Join children into one cluster with shared borders and collapsed inner radii. */
  attached?: boolean;
  orientation?: 'horizontal' | 'vertical';
  /** Applied to every child that does not set its own `size`. */
  size?: Size;
  /** Accessible name for the group (role="group"). */
  ariaLabel?: string;
};

/**
 * Clusters related actions (camera views, undo/redo, zoom) into one control.
 * Attached groups share borders and only round their outer corners.
 */
export function ButtonGroup({ children, attached = true, orientation = 'horizontal', size, ariaLabel, className, ...rest }: ButtonGroupProps) {
  const items = size
    ? Children.map(children, (child) =>
        isValidElement<{ size?: unknown }>(child) && child.props.size === undefined ? cloneElement(child, { size }) : child,
      )
    : children;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      className={cx(s.group, s[orientation], attached ? s.attached : s.spaced, className)}
      {...rest}
    >
      {items}
    </div>
  );
}
