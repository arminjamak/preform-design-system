import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { InfoTip } from '../Tooltip/Tooltip';
import s from './SectionTitle.module.css';

export type SectionTitleProps = {
  children: string;
  /** Tooltip text; renders the (i) glyph when set. */
  info?: string;
  action?: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
};

/** Bold heading that opens each group of controls inside a panel. */
export function SectionTitle({ children, info, action, size = 'md', className }: SectionTitleProps) {
  return (
    <div className={cx(s.row, s[size], className)}>
      <div className={s.lead}>
        <h3 className={s.title}>{children}</h3>
        {info && <InfoTip label={info} />}
      </div>
      {action}
    </div>
  );
}
