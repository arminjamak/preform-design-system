import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './ListItem.module.css';

export type ListItemProps = WithForcedState & {
  label: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  /** Blue left edge: the model whose history is open. */
  highlighted?: boolean;
  /** Faint text for hidden models. */
  muted?: boolean;
  /** Neutral surface instead of the tinted project-tree background. */
  variant?: 'tinted' | 'plain';
  onClick?: () => void;
  className?: string;
};

/** Model row from the project sidebar: eye toggle, name, actions menu. */
export function ListItem({ label, leading, trailing, selected, highlighted, muted, variant = 'tinted', onClick, className, ...rest }: ListItemProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} aria-pressed={onClick ? selected : undefined} aria-selected={!onClick ? selected : undefined} className={cx(s.item, variant === 'plain' && s.plain, selected && s.selected, highlighted && s.highlighted, muted && s.muted, className)} {...rest}>
      {leading && <span className={s.leading}>{leading}</span>}
      <span className={s.label}>{label}</span>
      {trailing && <span className={s.trailing}>{trailing}</span>}
    </Tag>
  );
}
