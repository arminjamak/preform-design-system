import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { InfoTip } from '../Tooltip/Tooltip';
import s from './FieldRow.module.css';

export type FieldRowProps = {
  label: string;
  info?: string;
  children?: ReactNode;
  layout?: 'inline' | 'stacked';
  hint?: string;
  error?: string;
  className?: string;
};

/** Label on the left, control on the right. The grid every panel is built from. */
export function FieldRow({ label, info, children, layout = 'inline', hint, error, className }: FieldRowProps) {
  return (
    <div className={cx(s.row, layout === 'stacked' && s.stacked, className)}>
      <div className={s.label}>
        <span>{label}</span>
        {info && <InfoTip label={info} />}
      </div>
      {children}
      {(error || hint) && <p className={cx(s.hint, error && s.error)}>{error ?? hint}</p>}
    </div>
  );
}
